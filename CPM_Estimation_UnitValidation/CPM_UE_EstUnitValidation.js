/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/error', 'N/record', 'N/runtime'],
/**
 * @param {error} error
 * @param {record} record
 * @param {runtime} runtime
 */
function(error, record, runtime) {
   
	function estimationItemUnit(itemId){
    	try{
    		var item = record.load({
    			type : record.Type.NON_INVENTORY_ITEM,
    			id : itemId
    		});
    		return item.getValue({fieldId : 'saleunit'});
    	} catch(ex){
    		log.debug({
    			title : 'FN_ESTITEMUNIT',
    			details : 'Name: ' + ex.name + '; Message : ' + ex.message
    		});
    	}
    }
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} sc
     * @param {Record} sc.newRecord - New record
     * @param {Record} sc.oldRecord - Old record
     * @param {string} sc.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(sc) {
    	var recType = sc.newRecord.type;
    	var perJobUnit = runtime.getCurrentScript().getParameter({
    		name : 'custscript_cpm_ue_perjobunit'
    	});
    	var eContext = runtime.executionContext;
    	var eventType = sc.type;
    	if (eventType == sc.UserEventType.CREATE || eventType == sc.UserEventType.EDIT || eventType == sc.UserEventType.XEDIT){
    			if 	(eContext == runtime.ContextType.CSV_IMPORT 
    				|| eContext == runtime.ContextType.SUITELET
    				|| eContext == runtime.ContextType.SCHEDULED
    				|| eContext == runtime.ContextType.CUSTOM_MASSUPDATE
    				|| eContext == runtime.ContextType.WEBSERVICES
    				|| eContext == runtime.ContextType.USEREVENT
    				) {
    				var itemUnit = null, itemField = null, unitField = null;
    		    	if (recType == 'customrecord_cpm_estimationcost'){
    		    		itemField = 'custrecord_cpm_est_cost_item';
    		    		unitField = 'custrecord_cpm_est_cost_unit';
    		    	} else if (recType == 'customrecord_cpm_estimationprice'){
    		    		itemField = 'custrecord_cpm_est_price_item';
    		    		unitField = 'custrecord_cpm_est_price_unit';
    		    	}
    		    	var itemId = sc.newRecord.getValue({fieldId: itemField});
    		    	itemUnit = estimationItemUnit(itemId);
    		    	
    		    	if (itemUnit == perJobUnit && itemUnit != sc.newRecord.getValue({fieldId: unitField})){
    		    		var ex = error.create({
    		    			name : 'EST_UNIT_VALIDATION',
    		    			message : 'Record not saved. If item sale unit is Per Job then the unit on this record MUST be Per Job.',
    		    			notifyOff : true
    		    		});
    		    		/*
    		    		log.debug({
    		    			title : ex.name,
    		    			message : ex.message
    		    		});
    		    		*/
    		    		throw ex;
    		    	}
    		    	
    			}
    	}
    }

    return {
        beforeSubmit: beforeSubmit        
    };
    
});
