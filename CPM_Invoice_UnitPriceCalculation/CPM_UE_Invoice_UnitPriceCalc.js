/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define([],

function() {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmitUnitPriceCalc(sc) {
    	log.debug('BS_Type', sc.type);
    	
    	if (sc.type != sc.UserEventType.CREATE && sc.type != sc.UserEventType.EDIT) return;
    	try {
    		
    		var rec = sc.newRecord;
    		
    		var lines = rec.getLineCount({
    		    sublistId: 'item'
    		});
    		
    		log.debug('sc.newRecord.type', sc.newRecord.type);
    		for (var i = 0; i < lines; i++)
    		{
    			
    			if (rec.type == 'invoice')
    			{
    				var rate = rec.getSublistValue({
    					sublistId : 'item',
    					fieldId   : 'rate',
    					line      : i
        			});
    				
    				var priceLevel = rec.getSublistValue({
    					sublistId : 'item',
    					fieldId   : 'price',
    					line      : i
        			});
    				
    				if (rate != null && priceLevel != -1) return;
    			}
    			
    			var amount = rec.getSublistValue({
					sublistId : 'item',
					fieldId   : 'amount',
					line      : i
    			});
    			
    			var quantity = rec.getSublistValue({
					sublistId : 'item',
					fieldId   : 'quantity',
					line      : i
    			});
    			
    			var calc = parseFloat(amount)/parseFloat(quantity);
    			
    			rec.setSublistValue({
                	sublistId : 'item',
                	fieldId   : 'rate',
                	line      : i,
                	value     : calc.toFixed(6)
                });
    			
    			rec.setSublistValue({
                	sublistId : 'item',
                	fieldId   : 'amount',
                	line      : i,
                	value     : amount
                });
            }
    	} catch(ex){
    		log.error(ex.name, ex.message+' for Record(ID): '+sc.newRecord.getValue("id"));
    	}
    	log.debug('BS', 'Ended');
    }

    return {
        beforeSubmit: beforeSubmitUnitPriceCalc
    };
    
});