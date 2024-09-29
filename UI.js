

class Button{
    constructor(rect, text, action){
        this.rect = rect;
        this.text = text;
        this.action = action;
    }

    OnEvent(e){
        if(e.type == 'render'){
            var color = CanvasColor([0.8,0.8,0.8]);
            var borderColor = CanvasColor([0,0.3,0.6]);
            if(RectContains(this.rect, mouse.position)){
                if(mouse.button0){
                    color = CanvasColor([0,0.8,1]);
                }
                else{
                    borderColor = CanvasColor([0.5,0.8,1]);
                }
            }
            e.canvas.FillRect(this.rect[0], this.rect[1], this.rect[2], this.rect[3], color);
            e.canvas.StrokeRect(this.rect[0], this.rect[1], this.rect[2], this.rect[3], 3, borderColor);
            var textWidth = e.canvas.MeasureText(this.text);
            e.canvas.FillText(this.text, this.rect[0] + this.rect[2]*0.5 - textWidth*0.5, this.rect[1]+style.fontSize, 'black');
        }
        else if(e.type == 'click'){
            if(RectContains(this.rect, mouse.position)){
                this.action();
                e.used = true;
            }
        }
    }
}

class Options{
    constructor(rect, options, action){
        this.rect = rect;
        this.options = options;
        this.action = action;
        this.option = options[0];
    }

    OnEvent(e){
        var y = this.rect[1];
        for(var option of this.options){
            var rect = [this.rect[0], y, this.rect[2], this.rect[3]];
            if(e.type == 'render'){
                var color = CanvasColor([0.8,0.8,0.8]);
                var borderColor = CanvasColor([0,0.3,0.6]);
                if(this.option == option){
                    color = CanvasColor([0,0.8,1]);
                }
                if(RectContains(rect, mouse.position)){
                    borderColor = CanvasColor([0.5,0.8,1]);
                }
                e.canvas.FillRect(rect[0], rect[1], rect[2], rect[3], color);
                e.canvas.StrokeRect(rect[0], rect[1], rect[2], rect[3], 3, borderColor);
                var textWidth = e.canvas.MeasureText(this.text);
                e.canvas.FillText(option, rect[0] + rect[2]*0.5 - textWidth*0.5, rect[1]+style.fontSize, 'black');
            }
            else if(e.type == 'click'){
                if(RectContains(rect, mouse.position)){
                    this.action(option);
                    this.option = option;
                    e.used = true;
                }
            }
            y+=style.lineSize;
        }
    }
}

class UI{
    constructor(rect){
        this.rect = rect;
        this.elements = [];
        this.y = this.rect[1];
    }

    AddButton(text, action){
        this.elements.push(new Button([this.rect[0], this.y, this.rect[2], style.lineSize], text, action));
        this.y+=style.lineSize + style.padding;
    }

    AddOptions(options, action){
        this.elements.push(new Options([this.rect[0], this.y, this.rect[2], style.lineSize], options, action));
        this.y+=style.lineSize * options.length + style.padding;
    }

    OnEvent(e){
        if(e.type == 'render'){
            e.canvas.SetFont(style.fontSize + 'px Arial');
            e.canvas.FillRect(this.rect[0], this.rect[1], this.rect[2], this.rect[3], CanvasColor([0.6,0.6,0.6]));
        }
        for(var element of this.elements){
            element.OnEvent(e);
        }

    }
}

