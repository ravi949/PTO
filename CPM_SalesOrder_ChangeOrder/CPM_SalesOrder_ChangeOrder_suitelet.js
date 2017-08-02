/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/redirect'],
/**
 * @param {record} record
 * @param {redirect} redirect
 */
function(record, redirect) {
   
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
    		var request = context.request;
    		log.debug('request ',request);
    		if(request.method == 'GET'){
    			var recordId =request.parameters.soid;
    			var oldRec = record.load({
     			    type: record.Type.SALES_ORDER, 
     			    id: recordId
     			}),                    
                recordFormTypeId= oldRec.getValue({fieldId:'customform',value:89}),
     			newRec = record.copy({
     			    type: record.Type.SALES_ORDER, 
     			    id: recordId
     			});
     			newRec.setValue({
     			    fieldId: 'memo',
     			    value: 'Change Order for SO '+oldRec.getValue({ fieldId: 'tranid' }),
     			    ignoreFieldChange: true
     			});
     			newRec.setValue({
     			    fieldId: 'custbody_cpm_changeorder',
     			    value: true
     			});
              oldRec.setValue({fieldId:'customform',value:89});
     			var numLines = oldRec.getLineCount({
     			    sublistId: 'item'
     			});

     			log.error('numLines ',numLines);
     			for(var v = 0; v< numLines; v++){
     				oldRec.setSublistValue({
         			    sublistId: 'item',
         			    fieldId: 'isclosed',
         			    line: v,
         			    value: true
         			});
     			}
     			oldRec.save({
     			    enableSourcing: true,
     			    ignoreMandatoryFields: true
     			});
     			var recId = newRec.save({
     			    enableSourcing: true,
     			    ignoreMandatoryFields: true
     			});
               var rec = record.load({
                   type: record.Type.SALES_ORDER, 
                  id: recordId
              });
              rec.setValue({fieldId:'customform',value:recordFormTypeId})
               rec.save({
               enableSourcing: true,
               ignoreMandatoryFields: true
             });
     			log.error('recId: ',recId);
     			redirect.toRecord({
     			    type : record.Type.SALES_ORDER, 
     			    id : recId, 
     			    isEditMode: true
     			});
    		}
    	}catch(e){
    		log.error('Error Occures: ',e);
    	}

    }

    return {
        onRequest: onRequest
    };
    
});
