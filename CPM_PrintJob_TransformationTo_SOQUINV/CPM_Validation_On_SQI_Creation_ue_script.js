/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search'],
/**
 * @param {record} record
 * @param {search} search
 */
function(record, search) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */	
	function beforeLoad(scriptContext) {
		if(scriptContext.type =='create'){
			var rec = scriptContext.newRecord,
			itemLength = rec.getLineCount('item'),
			printjobId = rec.getValue('createdfrom'), jobNbrPJId = 0;    		
			if(printjobId){
				//checking the record whether it is created from Print Job or not    			
				var printjobRec = search.create({
					type:search.Type.OPPORTUNITY,
					columns: ['internalid'],
					filters: [['internalid','is',printjobId]]
				}).run().getRange(0,10);
				if(printjobRec.length > 0){
					jobNbrPJId = printjobId;
					//getting the Estimate records list
					var estimateRecords = search.create({
						type:search.Type.ESTIMATE,
						columns: ['internalid'],
						filters: [['opportunity','is',printjobId],'and',['mainline','is','T']]
					}).run().getRange(0,10);
					//condition triggers when creating an Invoice from Print Job
					/*if(rec.type =='invoice'){
						if(estimateRecords.length > 0){
							throw Error('An Invoice cannot be created directly as there are Estimates associated to this Print Job');
						}
					}*/
					//condition triggers when creating a Sales Order from Print Job
					if(rec.type =='salesorder'){   				
						if(estimateRecords.length == 0){
							throw Error('A Sales Order cannot be created from this Print Job as there are no Estimates');
						}
						if(estimateRecords.length > 0){
							throw Error('There is an existing Quotation for this Print Job, Please create a Sales Order from the Quotation');
						}
					}

				}

			}
			//condition triggers when creating/viewing/Edit a Quotation
			if(rec.type =='estimate' && itemLength > 0){
				forRemovingLineItems(rec, itemLength,jobNbrPJId);
			}
			//condition triggers when creating/viewing/Edit a Invoice
			/*if(rec.type =='invoice' && itemLength > 0){
    			forRemovingLineItems(rec, itemLength);
    		}*/
			//condition triggers when creating/viewing/Edit a Sales Order
			if(rec.type =='salesorder' && itemLength > 0){
				forRemovingLineItems(rec, itemLength,jobNbrPJId);
			}
		}
    }
    
    function forRemovingLineItems(rec, itemLength,jobNbrPJId){
    	
    	for(var v = itemLength-1 ; v>= 0; v--){
    		
    		var itemInclude = rec.getSublistValue({
    			sublistId: 'item',
    			fieldId: 'custcol_cpm_pj_include',
    			line: v
    		});
    		
    		var itemEstExtCost = rec.getSublistValue({
    			sublistId: 'item',
    			fieldId: 'costestimate',
    			line: v
    		});
    		
    		var itemAmount = rec.getSublistValue({
    			sublistId: 'item',
    			fieldId: 'amount',
    			line: v
    		});
    		var jobNbrVal = rec.getSublistValue({
    			sublistId: 'item',
    			fieldId: 'custcoljobnbr',
    			line: v
    		});
    		if(jobNbrVal)
    			rec.setSublistValue({
    				sublistId: 'item',
    				fieldId: 'custcoljobnbr',
    				line: v,
    				value: jobNbrVal
    			});
    		else
    			rec.setSublistValue({
    				sublistId: 'item',
    				fieldId: 'custcoljobnbr',
    				line: v,
    				value: jobNbrPJId
    			});
    		if(itemInclude == false || (itemEstExtCost == 0 && itemAmount == 0)){
    			rec.removeLine({
    				sublistId: 'item',
    				line: v,
    				ignoreRecalc: true
    			});
    		}
		}
    	
	}
 /*   function toAddPaperItems(rec,printjobId){
    	 var paperItems = search.create({
 			type:'customrecord_cpm_paper_record',
 			columns: ['internalid','custrecord_cpm_paper_included'],
 			filters: [['custrecord_cpm_paper_printjob','is',printjobId],'and',['isinactive','is',false]]
 		 }).run().getRange(0,1000);
    	 log.debug('paperItems ',paperItems );
    	 var lineNum = rec.selectNewLine({
    		 sublistId: 'recmachcustrecord_cpm_paper_printjob'
    	 });
    	 rec.setSublistValue({
    		    sublistId: 'recmachcustrecord_paper_invoice',
    		    fieldId: 'custrecord_cpm_paper_included',
    		    line: 0,
    		    value: true
    		});
    }*/
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(scriptContext) {

    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(scriptContext) {

    }

    return {
        beforeLoad: beforeLoad,
//        beforeSubmit: beforeSubmit,
//        afterSubmit: afterSubmit
    };
    
});
