const RE = document.querySelector(':root');

const getCssVar = (name) => {
    return getComputedStyle(RE).getPropertyValue('--'.concat('', name));
};

const setCssVar = (name, value) => {
    RE.style.setProperty('--'.concat('', name), value);
};

document.closePopup = () => {
    const popups = document.querySelectorAll(".popup").forEach(popup => popup.classList.remove('active'));
};