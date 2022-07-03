import { addLoginCallback, reference, deleteField, getDoc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from "./firebase.js";
import * as ui from "./ui.js";

const todoList = document.querySelector('.todo .list');
const todoTabs = document.querySelector('.todo .tabs');

String.prototype.toCapitalized = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}
String.prototype.toTitleCase = function() {
    const sl = [' '];
    for (let i = 0; i < this.length; i++) {
        if (!sl.includes(this[i]) && !((this.charCodeAt(i) >= 65 && this.charCodeAt(i) < 91) || (this.charCodeAt(i) >= 97 && this.charCodeAt(i) < 123)))
            sl.push(this[i]);
    }
    const f = (t, s) => {
        return t.split(s).map(x => x.toCapitalized()).join(s);
    };
    let t = this.toLowerCase();
    sl.forEach(c => { t = f(t, c) });
    return t;
};

const decodeHtml = (html) => {
    var txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
};
const toRemoteName = (listName) => {
    return `list--${decodeHtml(listName).toLowerCase()}`;
};


var switchable = true;
document.switchTodoTab = (button) => {
    selectTodoTab(button.innerHTML);
};
const selectTodoTab = async(name) => {
    if (!Object.keys((await getDoc(reference.todo)).data()).includes(toRemoteName(name))) return;
    switchable = false;
    const newList = await buildTodoList(name);
    todoTabs.querySelectorAll('button').forEach((sibling) => {
        if (sibling.innerHTML == name) sibling.classList.add("active");
        else sibling.classList.remove("active");
    });
    removeCurrentTodoList();
    todoList.appendChild(newList);
    switchable = true;
};

document.checkOff = (checkbox) => {
    setTimeout(() => {
        if (checkbox.checked) {
            removeRemoteTodoItem(getCurrentTodoListName(), checkbox.parentElement.lastChild.innerHTML);
            checkbox.parentElement.parentElement.removeChild(checkbox.parentElement);
        }
    }, 1500);
};

const loadFile = async(file, parent = null) => {
    const res = await fetch(file);
    const text = await res.text();
    if (parent) parent.innerHTML = text;
};




const tabMenu = async(e) => {
    e.preventDefault();
    const tab = e.target;
    const tabName = tab.innerHTML;
    ui.preventScrolling(document.body);
    const context = document.createElement('dialog');
    context.appendChild(document.createElement('div'));
    context.firstChild.className = 'background';
    const clickBack = () => {
        context.className = '';
        setTimeout(() => context.remove(), 1000);
        document.body.style = '';
    };
    context.firstChild.addEventListener('click', clickBack);
    context.firstChild.addEventListener('contextmenu', e => e.preventDefault());

    context.appendChild(document.createElement('div'));
    context.lastElementChild.appendChild(document.createElement('button'));
    await loadFile('../assets/x-solid.svg', context.lastElementChild.lastElementChild);
    context.lastElementChild.lastElementChild.lastElementChild.style = 'fill: var(--cancel-button-color)';
    context.lastElementChild.lastElementChild.addEventListener('click', ev => {
        clickBack();
        setTimeout(() => {
            let response = confirm(`Are you sure you want to remove the ${tabName} todo list?\n\n(This action cannot be reversed).`);
            if (response) deleteList(tabName);
        }, 700);
    });
    context.lastElementChild.appendChild(document.createElement('button'));
    await loadFile('../assets/plus-solid.svg', context.lastElementChild.lastElementChild);
    context.lastElementChild.lastElementChild.addEventListener('click', ev => {
        clickBack();
        const form = document.querySelector('.primary-content .todo .popup#td-item')
        form.classList.add('active');
        const li = form.querySelector('#todo--item--list');
        li.value = decodeHtml(tabName);
        const it = form.querySelector('#todo--item--name');
        it.focus();
        it.select();
    });
    context.lastElementChild.appendChild(document.createElement('button'));
    await loadFile('../assets/pen-to-square-solid.svg', context.lastElementChild.lastElementChild);
    context.lastElementChild.lastElementChild.addEventListener('click', ev => {
        clickBack();
        //TODO: edit list popup
    });
    document.body.appendChild(context);
    const rect = e.target.getBoundingClientRect();
    context.style = `top: ${rect.top + (rect.height - context.offsetHeight) / 2}px;left: calc(${rect.right}px + 1rem)`;

    context.classList.add('active');
};

const removeRemoteTodoItem = async(listName, value) => {
    //TODO: switch to nested edit (https://firebase.google.com/docs/firestore/manage-data/add-data?hl=en&authuser=0#update_fields_in_nested_objects)
    const obj = {};
    const remoteList = await loadPersistentList(listName);
    for (let todoObject of remoteList) {
        if (todoObject.value == value) {
            obj[`${toRemoteName(listName)}.list`] = arrayRemove(todoObject);
            await updateDoc(reference.todo, obj);
        }
    }
};

const getListNames = () => {
    const tabs = todoTabs.children;
    const nameList = [];
    for (let i = 0; i < tabs.length; i++) {
        nameList.push(tabs[i].innerHTML.toLowerCase());
    }
    return nameList;
};

const deleteList = async(listName) => {
    const obj = {};
    obj[toRemoteName(listName)] = deleteField();
    await updateDoc(reference.todo, obj);
};

const getCurrentTodoListName = () => {
    return todoTabs.querySelector('.active').innerHTML.toLowerCase();
};

const refreshTodoTabs = () => {

    const oldTab = todoTabs.querySelector('.active');
    const oldTabName = oldTab ? oldTab.innerHTML : null;
    removeTodoTabs();
    addTodoTabs();
    if (oldTabName != null) selectTodoTab(oldTabName);
    else {
        const leftTab = getLeftmostTab();
        if (leftTab != null) selectTodoTab(leftTab);
    }
};

const getLeftmostTab = () => {
    const tabs = todoTabs.children;
    for (let i = 0; i < tabs.length; i++) {
        console.log(tabs[i]);
    }
};

const removeTodoTabs = () => {
    while (todoTabs.firstChild) todoTabs.removeChild(todoTabs.firstChild);
};

const addTodoTabs = async() => {
    const lists = await getLists();
    for (let i = 0; i < lists.length; i++) {
        todoTabs.appendChild(buildTodoTab(lists[i].name, lists[i].order));
    }
    todoTabs.firstElementChild.classList.add("active");
};

const buildTodoTab = (name, order) => {
    const btn = document.createElement("button");
    btn.setAttribute("onclick", "switchTodoTab(this)");
    btn.addEventListener("contextmenu", tabMenu);
    btn.className = "tab";
    btn.innerHTML = name.toTitleCase();
    btn.style = `order:${order};`
    return btn;
}

const refreshCurrentTodoList = async(data = null) => {
    const name = getCurrentTodoListName();
    if (!Object.keys((await getDoc(reference.todo)).data()).includes(toRemoteName(name))) return;
    const newList = await buildTodoList(name, data);
    removeCurrentTodoList();
    todoList.appendChild(newList);
};

const removeCurrentTodoList = (parent = todoList) => {
    while (parent.firstElementChild) {
        parent.removeChild(todoList.firstElementChild);
    }
};

const buildTodoList = async(listName, data = null) => {
    const list = await loadPersistentList(listName, data);
    const ul = document.createElement("ul");
    list.forEach(tdi => ul.appendChild(buildTodoItem(tdi)));
    return ul;
};

const buildTodoItem = (tdObj) => {
    const li = document.createElement("li");
    const check = document.createElement("input");
    const p = document.createElement("p");
    p.innerHTML = tdObj.value;
    check.type = "checkbox";
    check.setAttribute("onclick", "checkOff(this)");
    li.setAttribute('todoObj', tdObj);
    li.appendChild(check);
    li.appendChild(p);
    return li;
};

const addNewList = async(listName, displayOrder = null) => {
    displayOrder = displayOrder || ((await getMaxOrder()) + 1);
    const obj = {};
    obj[toRemoteName(listName)] = { list: [], order: displayOrder }
    await updateDoc(reference.todo, obj);
};

const getMaxOrder = async(lists = null) => {
    return await getFuncAttribute(Math.max, 'order', lists);
}

const listOrderExists = async(testOrder, lists = null) => {
    const test = (o, n) => {
        if (n == true || o == testOrder) {
            return true;
        }
        return false;
    };
    return test(-1, await getFuncAttribute(test, 'order', lists));
}

const getFuncAttribute = async(func = (x, y) => x + y, attr = null, lists = null) => {
    if (!attr || !func || typeof(attr) != "string") return null;
    lists = lists || await getLists();
    let n = lists[0][attr];
    for (let i = 0; i < lists.length; i++) {
        n = func(lists[i][attr], n);
    }
    return n;
};

const loadPersistentList = async(listName, data = null) => {
    data = data || (await getDoc(reference.todo)).data();
    const storedList = data[toRemoteName(listName)].list;
    return storedList;
};

const getLists = async() => {
    const data = (await getDoc(reference.todo)).data();
    const fields = Object.keys(data);
    const lists = {};
    let i = 0;
    fields.forEach((field) => {
        if (field.slice(0, 6) == 'list--') {
            data[field].name = field.toLowerCase().slice(6);
            lists[field] = data[field];
            lists[i++] = data[field];
        }
    });
    lists.length = i;
    return lists;
}
const updatePersistentList = async(listName, list) => {
    const obj = (await getDoc(reference.todo)).data();
    obj[toRemoteName(listName)].list = list;
    await updateDoc(reference.todo, obj);
};

const addNewListItem = async(listName, value, object = {}) => {
    listName = listName || getCurrentTodoListName();
    object.value = object.value || value;
    const upd = {};
    upd[`${toRemoteName(listName)}.list`] = arrayUnion(object);
    await updateDoc(reference.todo, upd);
};

const clearForm = (form) => {
    const inputCollection = form.getElementsByTagName("input");
    for (let i = 0; i < inputCollection.length; i++) {
        inputCollection[i].value = '';
    }
};

const getFormData = (form) => {
    const disls = form.querySelectorAll(':disabled');
    for (var i = 0; i < disls.length; i++) disls[i].disabled = false;
    const data = new FormData(form);
    for (i = 0; i < disls.length; i++) disls[i].disabled = true;
    return data;
};

const itemForm = (form) => {
    const fd = getFormData(form);
    var listname, itemname;
    for (var pair of fd.entries()) {
        switch (pair[0]) {
            case 'itemname':
                itemname = pair[1];
                break;
            case 'listname':
                listname = pair[1];
                break;
            default:
                break;
        }
    }
    if (getListNames().includes(listname)) return;
    if (itemname.length < 1 || itemname.length > 50) return;
    addNewListItem(listname, itemname);
    document.closePopup();
    clearForm(form);
};

const listForm = async(form) => {
    const fd = getFormData(form);
    var listname, order;
    for (var pair of fd.entries()) {
        switch (pair[0]) {
            case 'listname':
                listname = pair[1];
                break;
            case 'order':
                order = parseInt(pair[1]);
                break;
            default:
                break;
        }
    }

    if (listname.length < 1 || listname.length > 15) { console.log('list name not correct length'); return; }
    if (getListNames().includes(listname.toLowerCase())) { console.log('list name already exists'); return; }
    if (isNaN(order)) order = (await getMaxOrder()) + 1;
    if (await listOrderExists(order)) { console.log('list order already exists'); return; }

    addNewList(listname, order);
    document.closePopup();
    clearForm(form);
};
const addFormListener = (form, resultsFunction) => {
    form.addEventListener("submit", e => {
        e.preventDefault();
        if (e.submitter && e.submitter.className.includes("cancel")) return;
        resultsFunction(form);
    });
    const inputs = form.getElementsByTagName("input");
    for (let i = 0; i < inputs.length; i++) {
        inputs[i].addEventListener("keypress", e => {
            const key = e.charCode || e.keyCode || 0;
            //console.log(key);
            if (key == 13) {
                e.preventDefault();

                resultsFunction(form);
            }
        });
    }
};

var unsub = () => {};
addLoginCallback(refreshTodoTabs);
addLoginCallback(() => {
    unsub();
    unsub = onSnapshot(reference.todo, doc => {
        refreshCurrentTodoList(doc.data());
        refreshTodoTabs();
    });
});

document.addEventListener("DOMContentLoaded", e => {
    addFormListener(document.querySelector(".primary-content .todo .popup#td-item form"), itemForm);
    addFormListener(document.querySelector(".primary-content .todo .popup#td-list form"), listForm);
});

window.refreshTodoTabs = refreshTodoTabs;