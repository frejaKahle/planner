//TODO: display current date and time
//hint: use setInterval

import { reference, addLoginCallback, getDoc, setDoc, updateDoc, deleteField, onSnapshot } from './firebase.js';

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const timeElList = [];
const dateElList = [];
const format = {
    time: '24h',
    withSeconds: false,
    date: 'dmy',
    month: 'short',
    year: 4,
    yearOffset: 0,
    dateFirst: true
};
var interval;

const timeFunction = (date) => {
    const hrs = date.getHours()
    const arr = [hourString(hrs), minuteString(date.getMinutes())]
    if (format.withSeconds) arr.push(minuteString(date.getSeconds()));
    const pre = format.time == '12h' ? (hrs > 11 ? ' PM' : ' AM') : '';
    return [arr.join(':'), pre].join('');
};

const changeDisplayOrder = () => {
    const ord = 0 - format.dateFirst;
    dateElList.forEach(el => el.style = `order: ${ord};`);
};

const dateFunction = (date) => {
    var lastType, type;
    const arr = [];
    format.date.split('').forEach(c => {
        switch (c) {
            case 'w':
            case 'm':
                type = 'string';
                break;
            case 'd':
            case 'y':
                type = 'number';
                break;
            default:
                type = null;
                break;
        }
        const pre = lastType ? (type == lastType ? ', ' : ' ') : '';
        arr.push(pre);
        lastType = type;
        switch (c) {
            case 'w':
                arr.push(weekDayString(date.getDay()));
                break;
            case 'm':
                arr.push(monthString(date.getMonth()));
                break;
            case 'd':
                arr.push(date.getDate().toString(10));
                break;
            case 'y':
                arr.push(yearString(date.getFullYear()));
                break;
            default:
                break;
        }
    });
    return arr.join('');
};
window.ffff = format;
window.df = dateFunction;

const getRemoteData = async() => {
    return (await getDoc(reference.calendar)).data();
};

const getFormat = async(data = null) => {
    data = (data || (await getRemoteData()) || { settings: {} }).settings;
    format.time = data.time || '24h';
    format.withSeconds = data.withSeconds || false;
    format.date = data.date || 'dmy';
    format.month = data.month || 'short';
    format.year = Math.max(Math.min(data.yearDigits, 6), 2) || 4;
    format.yearOffset = data.yearOffset || 0;
    if (data.dateFirst && format.dateFirst != data.dateFirst) {
        format.dateFirst = data.dateFirst || true;
        changeDisplayOrder();
    }
};

document.addEventListener('DOMContentLoaded', e => {
    document.querySelectorAll('.date-display').forEach(div => {
        const timeEl = div.querySelector('.time') || div.querySelector('h3') || div.firstElementChild;
        const dateEl = div.querySelector('.date') || div.querySelector('h1') || div.lastElementChild;
        if (timeEl == dateEl) throw new Error('Invalid date setup.\nPlease add at least two elements to date display');
        timeElList.push(timeEl);
        dateElList.push(dateEl);
    });
    changeDisplayOrder();
});

const intervalFunction = () => {
    const now = new Date();
    const time_s = timeFunction(now);
    const date_s = dateFunction(now);
    timeElList.forEach(el => {
        if (el.innerHTML != time_s) el.innerHTML = time_s;
    });
    dateElList.forEach(el => {
        if (el.innerHTML != date_s) el.innerHTML = date_s;
    });
};

const ensureSettings = async() => {
    await getFormat();
    await setDoc(reference.date, { settings: format }, { merge: true });
};

const minuteString = (minutes) => minutes.toString(10).padStart(2, '0');
const hourString = (hours) => format.time == '12h' ? (hours % 12 == 0 ? '12' : (hours % 12).toString(10)) : hours.toString(10).padStart(2, '0');
const weekDayString = (weekday) => weekdays[weekday];
const monthString = (month) => format.month == 'short' ? shortMonthNames[month] : monthNames[month];
const yearString = (year) => (year + format.yearOffset).toString(10).padStart(format.year, '0').slice(-format.year);


addLoginCallback(ensureSettings);
interval = setInterval(intervalFunction, 200);