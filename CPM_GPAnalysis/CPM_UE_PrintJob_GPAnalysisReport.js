/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope TargetAccount
 */
define(['N/runtime', 
		'N/url',
		'N/search',
		'N/record'
	],

function(runtime, url, search, record) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoadPrintGPAnalysis(sc) {
    	try{
    		//Script should work in "VIEW" mode and "UI" contextType
        	if (runtime.executionContext != runtime.ContextType.USER_INTERFACE) return;
        	if (sc.type != sc.UserEventType.VIEW) return;
        	
        	//Script Parameters
        	var scriptObj = runtime.getCurrentScript();
    		var suiteletsid = scriptObj.getParameter({name: 'custscript_pjpue_ssid'});
    		var suiteletdid = scriptObj.getParameter({name: 'custscript_pjpue_sdid'});
    		log.debug('Script Parameters', 'Suitelet SID: '+suiteletsid+' and Suitelet DID: '+suiteletdid);
    		
        	//Search of 'INVOICE' type to fetch
        	var searchObj = search.create({
    			type : record.Type.INVOICE,
    			
    			filters : [

    				search.createFilter({
    					name 	 : 'custcoljobnbr',
    					operator : 'is',
    					values 	 : sc.newRecord.getValue("id")
    				}), 
    				
    				search.createFilter({
    					name 	 : 'accounttype',
    					operator : 'anyof',
    					values 	 : 'Income'
    				})
    			],
    			
    			columns : [ 
    				search.createColumn({
    					name : 'internalid',
    				}) 
    			]
    		});
        	
        	var searchResults = searchObj.run().getRange({
    			start: 0,
    			end : 9
    		});
        	log.debug('searchResults.length', searchResults.length);
        	
        	//load the backend suitelet url if the above search returns the results
        	if (searchResults.length > 0){ 
        		var creURL = url.resolveScript({
                    'scriptId'			:suiteletsid,
                    'deploymentId'		:suiteletdid,
                    'returnExternalUrl' : false
                }) + '&jobid=' + sc.newRecord.getValue("id");
        		
        		log.debug('sc.newRecord.getValue("id")', sc.newRecord.getValue("id"));

        		//inline code to work on Button click and to call the above backend suitelet.
        		var getPrintJobProfitability = "require([], function() { window.open('"+creURL+"','Profitability Report');});";
        		
        		//Adding a custom button to "Profit Report" record before loading the form
        		sc.form.addButton({
                    id           : 'custpage_button_printjobprofit',
                    label        : 'Profit Report',
                    functionName : getPrintJobProfitability
                });
        	}
    	}catch(e){
    		log.debug(e.name, e.message);
    	}
    }

    return {
        beforeLoad: beforeLoadPrintGPAnalysis
    };
    
});