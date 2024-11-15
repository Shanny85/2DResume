import kaboom from 'kaboom';

export const kboom = kaboom({
    global: false,
    touchToMouse: true,
    canvas: document.getElementById("game")
})