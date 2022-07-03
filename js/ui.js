export const preventScrolling = (elem, keepwidth = true) => {
    // prevents scrolling on a scrollable element until allowScrolling(elem) is called

    // get document width
    const w = elem.offsetWidth;
    // disable scrolling
    elem.style.overflowY = 'hidden';
    // set border to replace scrollbar (so content width doesn't change)
    elem.style.borderRight = `${(elem.offsetWidth-w) * keepwidth}px solid transparent`;
};

export const allowScrolling = (elem) => {
    // allows scrolling on a scrollable element that has had scrolling disabled with preventScrolling(elem)

    // unset border
    elem.style.borderRight = 'none';
    // enable scrolling
    elem.style.overflowY = 'auto';
};