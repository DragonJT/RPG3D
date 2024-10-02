
function CreateCanvas(width, height){
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

function Select(name, options, getValue, onchange){
    var label = document.createElement('label');
    label.innerHTML = name;
    label.htmlFor = name;

    var select = document.createElement('select');
    select.id = name;
    for(var o of options){
        var option = document.createElement('option');
        option.value = o;
        option.innerHTML = o;
        select.appendChild(option);
    }
    select.value = getValue();
    select.refreshValue = ()=>{
        select.value = getValue();
    }
    select.onchange = ()=>onchange(select.value);
    return Div({}, [label, select]);
}

function FloatBox(name, getValue, onchange){
    var label = document.createElement('label');
    label.innerHTML = name;
    label.htmlFor = name;

    var input = document.createElement('input');
    input.type = 'number';
    input.value = getValue();
    input.refreshValue = ()=>{
        input.value = getValue();
    }
    input.onchange = ()=>{
        var value = parseFloat(input.value);
        onchange(value);
    };
    return Div({}, [label, input]);
}

function ColorBox(name, getValue, onchange){
    var label = document.createElement('label');
    label.innerHTML = name;
    label.htmlFor = name;

    var input = document.createElement('input');
    input.type = 'color';
    input.value = RGB2Hex(getValue());
    input.refreshValue = ()=>{
        input.value = RGB2Hex(getValue());
    }
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

function RefreshValues(){
    function RefreshWithTag(tag){
        for(var c of document.body.getElementsByTagName(tag)){
            if(c.refreshValue){
                c.refreshValue();
            }
        }
    }
    RefreshWithTag('input');
    RefreshWithTag('select');
}