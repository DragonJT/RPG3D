
function Button(text, onclick){
    var button = document.createElement('button');
    button.innerHTML = text;
    button.onclick = onclick;
    return button;
}

function Div(style, children){
    var div = document.createElement('div');
    var keys = Object.keys(style);
    for(var key of keys){
        div.style[key] = style[key];
    }
    for(var c of children){
        div.appendChild(c);
    }
    return div;
}