/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/record', 'N/ui/serverWidget','N/file'],

function(record, serverWidget,file) {
   
    
    function beforeLoad(scriptContext) {
    	try{ 
    		if(scriptContext.type == 'view'){
    			var recordId = scriptContext.newRecord.id;
    			/******* loading the client script *******/
    			scriptContext.form.clientScriptModulePath ='./CPM_PrintJob_Print_clientscript.js';
    			/******* Adding button to PrintJob record to get PDF View  *******/
    			scriptContext.form.addButton({
    				id : 'custpage_newButton',
    				label : 'Print',
    				functionName:'callPrintSuitelet('+recordId+')'        	    
    			});
    		}
    	}catch(e){
    		log.debug('Exception:	', e);
    	}
    }
    return {
        beforeLoad: beforeLoad
    };
    
});
