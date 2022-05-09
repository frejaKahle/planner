const todoList = document.querySelector('.todo .list');
const todoTabs = document.querySelector('.todo .tabs');

function switchTodoTab(button) {
    todoTabs.querySelectorAll('button').forEach((sibling) => {
        sibling.classList.remove("active");
    });
    button.classList.add("active");
    removeCurrentTodoList();
    addTodoList(button.innerHTML);
}

function removeCurrentTodoList(parent = todoList) {
    while (parent.firstElementChild) {
        parent.removeChild(todoList.firstElementChild);
    }
}

function addTodoList(listName) {
    let list = loadListObject(listName);
    if (!listName || listName == "All") {
        let listslist = [];
        Object.keys(list).forEach((key) => {
            listslist.push(list[key]);
        });
        list = [].concat.apply([], listslist);
    }
    //TODO: construct list

}

const loadListObject = (listName) => {
    const storedObj = localStorage.getItem("toDoLists");
    if (typeof storedList !== "string") return;
    const parsedObj = JSON.parse(storedList);
    if (!listName || listName == "All") return parsedObj;
    return parsedObj[listName];
};
const updatePersistentList = (listName) => {
    let obj = loadListObject();
    obj[listName] = JSON.stringify(listArray);
    localStorage.setItem("toDoLists", obj);
};