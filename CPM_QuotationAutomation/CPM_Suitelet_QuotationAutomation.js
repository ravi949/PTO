/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/redirect'],
/**
 * @param {record} record
 * @param {runtime} runtime
 */
function(record, runtime, redirect) {
   
	
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
    	//log.debug('request', context.request.parameters.pjid);
    	var printJobColumnId = runtime.getCurrentScript().getParameter({
    		name	:	'custscript_cpm_qa_printjobcolid'
    	});
    	var quote = record.transform({
    		fromType	:	record.Type.OPPORTUNITY,
    		fromId	:	context.request.parameters.pjid,
    		toType	:	record.Type.ESTIMATE,
    		isDynamic	:	false
    	});
    	
    	var createdFrom = quote.getValue({
    		fieldId		:	'createdfrom'
    	});
    	
    	var lines = quote.getLineCount('item');
        //changed the looping and added the remove line item if item include? is false
    	for (var i = lines-1; i >=0 ; i--){
          if(quote.getSublistValue({sublistId:'item',fieldId:'custcol_cpm_pj_include',line:i})){
            quote.setSublistValue({
    			sublistId	:	'item',
    			line	:	i,
    			fieldId	:	printJobColumnId,
    			value	:	createdFrom
    		}); 
          }else{
            quote.removeLine({
    			sublistId	:	'item',
    			line	:	i,
                ignoreRecalc: true
    		}); 
          }
    	}
    	
    	var quoteId = quote.save({
    		enableSourcing	:	true,
    		ignoreMandatoryFields	:	true
    	});
    	    	
    	redirect.toRecord({
    		type		:	record.Type.ESTIMATE,
    		id			:	quoteId,
    		isEditMode	:	false
    	});
    }

    return {
        onRequest: onRequest
    };
    
});
