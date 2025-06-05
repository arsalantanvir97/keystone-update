var ExMatch = require('expression-match'); // Matches objects with expressions

/**
 * Checks if something is an object
 *
 * @param  {Any} arg   The something we want to check the type of
 * @return {Boolean} If arg is an object or not
 */
function isObject (arg) {
	return Object.prototype.toString.call(arg) === '[object Object]';
};

/**
 * Evaluates the visibility of a field based on its dependencies and their values
 *
 * @param  {Object|Any} dependsOn The dependsOn variable we get from the field
 * @param  {Object}		values    The values currently in the fields
 * @return {Boolean}			  If the current field should be displayed based
 *                          	  on it's dependencies and their values
 */
module.exports = function evalDependsOn (dependsOn, values) {
	if (!isObject(dependsOn) || !Object.keys(dependsOn).length) {
		return true;
	}
	 
	// Checks if the current field should be displayed, based on the values of
	// other fields and the dependsOn configuration of this field
    let key = Object.keys(dependsOn) && Object.keys(dependsOn)[0];
	if (key){
        let val = dependsOn[key];
        let key1 = Object.keys(val) && Object.keys(val)[0];
        let newval = val[key1];
        if (key1=='$ne' && newval && Array.isArray(newval) && !newval.length){
            if (values[key] && !values[key].length)
            	return false;
		}
	}

	var Match = new ExMatch(dependsOn, values, false);
	return Match.match();
};
