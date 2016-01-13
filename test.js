var $ = require('jquery');
function parse(txt) {
    var ret = null;
    // usage:
    // height: (eq (+ '.info-wrapper' (|| '.navbar' '.navbar-collapse')))
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
                    if(cfunc != null) { prev_func = cfunc.parent; }

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

function throwWrongArgs(args, len, funcName) {
    if (args.length != len) { throw Error("Not the right amount of args provided to " + funcName); }
}

var funcs = {
    "fill": function(args) {
        throwWrongArgs(args, 2, "fill");
        var e = args[0];
        var feild = args[1];
        if (feild == "height") {
            var parent = $(e).parent();
            if($(parent).innerWidth() <= $(e).outerWidth()) {
                return "auto";
            }
            return $(parent).height();
        }
    },
    "eq": function(args) {
        throwWrongArgs(args, 3, "eq");
        var e = args[0];
        var feild = args[1];
        if(typeof(args[2]) == "number") { return args[2]; }
        return parseInt($(args[2]).css(feild));
    },
    "+": function(args) {
        throwWrongArgs(args, 4, "+");
        var feild = args[1];
        for(var i = 2; i < args.length; ++i) {
            if(typeof(args[i]) == "string"){
                args[i] = parseInt($(args[i]).css(feild));
            }
        }
        return args[2] + args[3];
    },
    "||": function(args) {
        throwWrongArgs(args, 4, "||");
        var feild = args[1];
        if($(args[2]).css("display") != "none") {
            return parseInt($(args[2]).css(feild));
        }
        return parseInt($(args[3]).css(feild));
    }
}

function cust_find(array, func) {
    var ret;
    for(var i = 0; i < array.length; ++i) {
        ret = func(array[i], i, array);
        if(ret != null) {
            return ret;
        }
    }
    return null;
}

function findObj(element, index, array) {
    if (typeof(element.func) != "undefined") {
        return { ele: element, idx: index };
    }
    return null;
}

function handleDimensions(targets) {
    $.each($(targets), function(i, e) {
        var text = $(e).attr("data-dimension-fix");
        var first_colon = text.indexOf(":");
        var first_paren = text.indexOf("(");
        var feild_val = [ text.substring(0, first_colon), text.substring(first_paren, text.length) ];
        //console.log(feild_val);
        var val = parse(feild_val[1]);
        // console.log(i);
        // console.log(val);

        var cfunc;
        var next_ele = cust_find(val.args,findObj);
        var args = [$(e), "height"];
        if( next_ele != null) {
            cfunc = next_ele;
            while(cfunc.ele.parent != null) {
                while(next_ele != null) {
                    // console.log(next_ele.ele.args);
                    next_ele = cust_find(next_ele.ele.args,findObj);
                    if(next_ele == null) {
                        break;
                    }
                    cfunc = next_ele;
                    // console.log("Next element: " , cfunc);
                }
                // console.log("FUNC: " , cfunc.ele.func , " ARGS: " , cfunc.ele.args);
                $.merge(args, cfunc.ele.args);
                var tmp = funcs[cfunc.ele.func](args);
                // console.log("RESULT FROM " + cfunc.ele.func + " IS " + tmp);
                // console.log("PARENT: ", cfunc.ele.parent);
                cfunc.ele.parent.args[cfunc.idx] = tmp;
                next_ele = { ele: cfunc.ele.parent, idx: 0 };
                cfunc = { ele: cfunc.ele.parent, idx: 0 };
                args = [$(e), "height"];
            }
        }
        $.merge(args, val.args);
        // console.log(args);
        // console.log(val);
        // console.log("RESULT: " + funcs[val.func](args));
        $(e).css(feild_val[0], funcs[val.func](args));
    });
}


var targets = $("[data-dimension-fix]");
// console.log("Targets: " + targets.length);
// console.log("---------- INIT CALL ----------");
handleDimensions(targets);
// console.log("---------- END INIT CALL ----------");
window.onresize = function() {
    var targets = $("[data-dimension-fix]");
    handleDimensions(targets);
};
