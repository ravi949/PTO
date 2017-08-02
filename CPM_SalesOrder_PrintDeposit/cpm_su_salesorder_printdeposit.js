/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/render', 'N/runtime'],

function(render, runtime) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
    	
    	try{
    		var tranid = context.request.parameters.tranid;
    		var customForm = runtime.getCurrentScript().getParameter({name:'custscript_cpm_su_printdepositform'});
    		log.debug('Custom_Form', customForm);
    		var printPDF = render.transaction({
    			printMode: render.PrintMode.PDF,
    			formId: parseInt(customForm),
    			entityId: parseInt(tranid)
    		});
    		context.response.writeFile(printPDF, true);
    	}catch (ex) {
    		log.error('Suitelet_Print_Error', ex.name +'; message: ' + ex.message + '; tranid: ' + tranid);
    	}
    }

    return {
        onRequest: onRequest
    };
    
});
