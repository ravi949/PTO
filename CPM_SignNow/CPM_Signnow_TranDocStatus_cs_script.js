/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/url'],

function(url) {

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {
    	try{
    		if(scriptContext.fieldId == 'custpage_cpm_tranlist'){
    			var windowURL = new URL(window.location.href);
    			var suiteletURL = url.resolveScript({
    				scriptId: 'customscript_cpm_signnow_trandocstatusli',
    			    deploymentId: 'customdeploy_cpm_signnow_trandocstatusli',
    			    returnExternalUrl: false,
    			    params:{recid:scriptContext.currentRecord.getValue('custpage_cpm_tranlist'),
    			    		token:windowURL.searchParams.get('token')}
    			});
    			window.location.href = window.location.origin+suiteletURL;
    		}
    	}catch(e){
    		console.log(e.name,e.message);
    	}
    }

    return {
        fieldChanged: fieldChanged,
    };
    
});
