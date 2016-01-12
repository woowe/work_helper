var $ = require('jquery');
function applyDimension(target, max_dim, feild, value) {
    $(target).css(feild, max_dim * (100 / parseInt(value)) + "px");
}

function removeChar(txt, index) {
    return txt.substring(0, index) + txt.substring(index + 1, txt.length);
}

function parse(txt) {
    var ret = null;
    // usage:
    // height: (eq (+ .info-wrapper (|| .navbar .navbar-collapse)))
    // data structure:
    // {
    //     func: "eq",
    //     parent: null
    //     args: [
    //         {
    //             func: "+"
    //             parent: obj<eq>
    //             args: [
    //                 '.info-wrapper',
    //                 {
    //                     func: "||",
    //                     parent: obj<+>
    //                     args: [
    //                         '.navbar',
    //                         '.navbar-collapse'
    //                     ]
    //                 }
    //             ]
    //         }
    //     ]
    // }
    var cfunc = null;
    var prev_func = null;
    var quote = false;
    var token = "";
    var addTo = function(cfunc, token) {
        if (token.length > 0) {
            if (cfunc.func == "") { cfunc.func = token;}
            else {
                cfunc.args.push(token);
            }
            return "";
        }
        return token;
    }
    for(var i = 0; i < txt.length; ++i) {
        switch (txt[i]) {
            case "(":
                if (ret == null) {
                    ret = {
                        func: "",
                        args: [],
                        parent: null
                    };
                    cfunc = ret;
                    break;
                }
                if (!quote) {
                    prev_func = cfunc;
                    cfunc.args.push({
                        func: "",
                        args: [],
                        parent: cfunc
                    });
                    cfunc = cfunc.args[cfunc.args.length - 1];
                }
                break;
            case ")":
                if (!quote) {
                    if (token.length > 0) {
                        if (cfunc.func == "") { cfunc.func = token;}
                        else {
                            cfunc.args.push(token);
                        }
                        token = "";
                    }
                    cfunc = prev_func;
                    prev_func = cfunc.parent;
                    
                }
                break;
            case "'":
                if (!quote) { quote = true; }
                else { quote = false; }
                break;
            case " ":
                if (!quote) {
                    if (cfunc.func == "") { cfunc.func = token;}
                    else {
                        cfunc.args.push(token);
                    }
                    token = "";
                }
                break;
            default:
                token += txt[i];
                break;
        }
    }
    return ret;
}

var funcs = {
    "fill": function(args) {
        if (args.length != 2) { throw Error("Not the right amount of args provided to FILL"); }
        var e = args[0];
        var feild = args[1];
        if (feild == "height") {
            var parent = $(e).parent();
            $(e).height($(parent).height());
            if($(parent).innerWidth() <= $(e).outerWidth()) {
                $(e).height("auto");
            }
        }
    },
    "eq": function(args) {
        if (args.length != 3) { throw Error("Not the right amount of args provided to EQ"); }
        var e = args[0];
        var feild = args[1];
        $(e).css(feild, args[2]);
    }
}

function handleDimensions(targets) {
    $.each($(targets), function(i, e) {
        var text = $(e).attr("data-dimension-fix");
        var first_colon = text.indexOf(":");
        var first_paren = text.indexOf("(");
        var feild_val = [ text.substring(0, first_colon), text.substring(first_paren, text.length - 1) ];
        console.log(feild_val); 
        var val = parse(feild_val[1]);
        console.log(val);
    });
}


var targets = $("[data-dimension-fix]");
console.log("Targets: " + targets.length);
console.log("---------- INIT CALL ----------");
handleDimensions(targets);
console.log("---------- END INIT CALL ----------");
window.onresize = function() {
    var targets = $("[data-dimension-fix]");
    handleDimensions(targets);
};