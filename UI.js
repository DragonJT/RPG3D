
function CreateCanvas(width, height){
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

function Select(name, options, onchange){
    var label = document.createElement('label');
    label.innerHTML = name;
    label.htmlFor = name;

    var select = document.createElement('select');
    select.id = name;
    for(var o of options){
        var option = document.createElement('option');
        option.innerHTML = o;
        select.appendChild(option);
    }
    select.onchange = ()=>onchange(select.value);
    return Div({}, [label, select]);
}

function FloatBox(name, value, onchange){
    var label = document.createElement('label');
    label.innerHTML = name;
    label.htmlFor = name;

    var input = document.createElement('input');
    input.type = 'number';
    input.value = value;
    input.onchange = ()=>{
        var value = parseFloat(input.value);
        onchange(value);
    };
    return Div({}, [label, input]);
}

function ColorBox(name, value, onchange){
    var label = document.createElement('label');
    label.innerHTML = name;
    label.htmlFor = name;

    var input = document.createElement('input');
    input.type = 'color';
    input.value = RGB2Hex(value);
    input.onchange = ()=>{
        var color = Hex2RGB(input.value);
        onchange(color);
    }
    return Div({}, [label, input]);
}

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