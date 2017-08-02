/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/record', 'N/runtime', 'N/search'],
/**
 * @param {record}
 *            record
 * @param {runtime}
 *            runtime
 * @param {search}
 *            search
 */
function(record, runtime, search) {
   
    /**
	 * Function definition to be triggered before record is loaded.
	 * 
	 * @param {Object}
	 *            scriptContext
	 * @param {Record}
	 *            scriptContext.newRecord - New record
	 * @param {string}
	 *            scriptContext.type - Trigger type
	 * @param {Form}
	 *            scriptContext.form - Current form
	 * @Since 2015.2
	 */
    function CPM_GPAnalysis_beforeLoad(scriptContext) 
    {
    	try{
    	var scriptFileId = runtime.getCurrentScript().getParameter({name:'custscript_clientfileid'});
    	var recordid = scriptContext.newRecord.id;
    	if (scriptContext.type != 'view' && runtime.executionContext != runtime.ContextType.USER_INTERFACE) return;
    	  	if (searchInvoices(recordid)){
    		//scriptContext.form.clientScriptModulePath = 'SuiteScripts/CPM_GPAnalysisReport/CPM_ClientScript_GPAnalysis.js';
    	  		scriptContext.form.clientScriptFileId = scriptFileId;
    	  		scriptContext.form.addButton({
        	    id : 'custpage_button',
        	    label : 'Profit Report',
        	    functionName:'getPrintJobProfitability('+recordid+')'
        	});    		
    	}
    	} catch(ex) {
    		log.error('GPA_UE_BeforeLoad', ex.name + '; ' + ex.message);
    	}    		
    }
    function searchInvoices(jobid)
    {
    	var results= search.create({
    		type:'transaction',
    		columns:['internalid'],
    		filters:[[['custcoljobnbr','is',jobid],'and',
    	            ['type','is','CustInvc'],'and',
    	            ['accounttype','anyof','Income']]]
    	    		}).run().getRange(0,1);			
	    		
    	return results.length>0;
    }
    return {
       beforeLoad: CPM_GPAnalysis_beforeLoad        
   };
   
});    	