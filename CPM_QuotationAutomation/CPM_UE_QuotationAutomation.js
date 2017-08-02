/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/runtime', 'N/redirect', 'N/search', 'N/record'],

function(runtime, redirect, search, record) {
	
	/**
	 * Custom function to cehck if print job has open sales orders
	 * 
	 * @param {String} printJobId Internal ID of the print job for estimate search
	 * @since 2015.2
	 * @returns {boolean}
	 */
	function hasOpenSalesOrders(printJobId) {
		var soSearch = search.create({
			type : search.Type.SALES_ORDER,
			filters : [
			           [['opportunity', 'anyof', printJobId], 'or', ['createdfrom', 'anyof', printJobId]], 'and',
			           ['status', 'noneof', 'SalesOrd:C'], 'and',
			           ['status', 'noneof', 'SalesOrd:H'], 'and',
			           ['mainline', 'is', true]
			           ],
			columns : ['internalid', 'opportunity.internalid', 'createdfrom.internalid']
		});
		var soExistsFlag = false;
		soSearch.run().each(function(so) {
			soExistsFlag = true;
			return false;
		});
		return soExistsFlag;
	}
	
	/**
	 * Custom function to deactivate all other estimates on the Print Job
	 * 
	 * @param {String} printJobId Internal ID of the print job for estimate search
	 * @param {String} newQuoteId Internal ID of the current Estimate, to avoid closing it
	 * @param {String} cancelledStatus Internal ID of the Quotation Status which should be set to deactivate the transaction
	 * @since 2015.2
	 * @returns {void}
	 */
	function deactivateOtherEstimates(printJobId, newQuoteId, cancelledStatus) {
		
		var otherEstimates = search.create({
			type : search.Type.ESTIMATE,
			filters : [
			           [['opportunity', 'anyof', printJobId], 'or', 
			            ['createdfrom', 'anyof', printJobId]], 'and',
			            ['mainline', 'is', true], 'and',
			            ['entitystatus', 'noneof', cancelledStatus], 'and',
			            ['internalid', 'noneof', newQuoteId]
			           ],
			columns : ['internalid', 'opportunity.internalid']
		});
		
		otherEstimates.run().each(function(estimate) {
			var tranId = estimate.getValue({name:'internalid'});
			if (tranId == newQuoteId) return true;
			var oldEstimate = record.load({
				type : record.Type.ESTIMATE,
				id : tranId
			}).setValue({
				fieldId : 'entitystatus',
				value	:	cancelledStatus
			}).setValue({
				fieldId : 'visibletocustomer',
				value : false
			}).save({
				enableSourcing : true,
				ignoreMandatoryFields : true
			});
			return true;
		});
		
		}
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} sc
     * @param {Record} sc.newRecord - New record
     * @param {string} sc.type - Trigger type
     * @param {Form} sc.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(sc) {
    	if (sc.type == sc.UserEventType.CREATE){
    		var cFrom = sc.newRecord.getValue({fieldId : 'createdfrom'});
    		var opp = sc.newRecord.getValue({fieldId : 'opportunity'});
    		if (hasOpenSalesOrders(cFrom) || hasOpenSalesOrders(opp)) throw new Error('This print job has an open sales order. This estimate cannot be created.');
    		if(runtime.executionContext == runtime.ContextType.USER_INTERFACE){
	    		//var cFrom = sc.newRecord.getValue({fieldId : 'createdfrom'});
	    		if (cFrom != '' && cFrom != null){
	    			var currentScript = runtime.getCurrentScript();
	    			var suiteletScriptId = currentScript.getParameter({
	    					name	:	'custscript_cpm_qa_suiteletid'
	    				}), 
	    				suiteletDeployId = currentScript.getParameter({
	    					name	:	'custscript_cpm_qa_suiteletdeployid'
	    				});
	    			redirect.toSuitelet({
	    				scriptId : suiteletScriptId,
	    				deploymentId :	suiteletDeployId,
	    				isExternal : false,
	    				parameters : {'pjid' : cFrom}
	    			});
	    		}
	    	}
    	}
    }

    /**
     * Function definition to be triggered before record is saved.
     *
     * @param {Object} sc
     * @param {Record} sc.newRecord - New record
     * @param {Record} sc.oldRecord - Old record
     * @param {string} sc.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(sc) {
		if (sc.type == sc.UserEventType.CREATE || sc.type == sc.UserEventType.EDIT){
			var printJobId = sc.newRecord.getValue({fieldId:'opportunity'});
			if (hasOpenSalesOrders(printJobId)) throw new Error('This print job has an open sales order. This estimate cannot be saved.');
		}
	}
    
    /**
     * Function definition to be triggered after record is saved.
     *
     * @param {Object} sc
     * @param {Record} sc.newRecord - New record
     * @param {Record} sc.oldRecord - Old record
     * @param {string} sc.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(sc) {
    	var newQuote = sc.newRecord;
    	var newQuoteId = newQuote.id;
    	var printJobId = newQuote.getValue({fieldId:'opportunity'});
		var cancelledStatus = runtime.getCurrentScript().getParameter({name:'custscript_cpm_qa_cancelledstatus'});
		try{
			if ((sc.type == sc.UserEventType.CREATE || sc.type == sc.UserEventType.EDIT) && newQuote.getValue({fieldId:'entitystatus'}) != cancelledStatus){
				deactivateOtherEstimates(printJobId, newQuoteId, cancelledStatus);
			}
		} catch(ex) {
			log.error({
				title : ex.name, details : ex.message
			});
		}
	}
    
    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});
