var my = {};
(function() {

    this.compose = function(/* fns */) {
        let args = arguments;
        let start = args.length - 1;
        return function() {
            let i = start;
            let result = args[start].apply(this, arguments);
            while (i--)
                result = args[i].call(this, result);
            return result;
        }; 
    }
    
    this.curry = function(fn) {
        var arity = fn.length;
    
        function given (argsSoFar) {
            return function helper () {
                var args             = Array.prototype.slice.call(arguments, 0);
                var updatedArgsSoFar = argsSoFar.concat(args);
    
                if (updatedArgsSoFar.length >= arity) {
                    return fn.apply(this, updatedArgsSoFar);
                }
                else {
                    return given(updatedArgsSoFar);
                }
            };
        }
    
        return given([]);
    }


}).apply(my);    
