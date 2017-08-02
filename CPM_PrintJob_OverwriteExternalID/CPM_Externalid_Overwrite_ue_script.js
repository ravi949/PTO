/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/runtime'],

function(record,runtime) {
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function overwriteExternalid(scriptContext) {
    	if(scriptContext.type != 'delete'){
    		var recId = scriptContext.newRecord.id,
    		printJobRec = record.load({
    			type:record.Type.OPPORTUNITY,
    			id:recId,
    			isDynamic:true
    		}),
    		printJobOldRec = scriptContext.oldRecord,
    		customerNewId = printJobRec.getValue('entity'),oldExternalid,
    		custProject = printJobRec.getValue('custbody12'),
    		jobNumber = printJobRec.getValue('tranid');
    		
    		if(scriptContext.type != 'create'){
				oldExternalid = printJobOldRec.getValue('externalid');
			}
 
    		if(custProject){
    			var newExternalid = customerNewId+'_'+custProject.replace(/ /g,'_');
    			saveRecord(printJobRec,newExternalid,oldExternalid);
    		}else if(custProject == ''){
    			var newExternalid = customerNewId+'_'+jobNumber;
    			saveRecord(printJobRec,newExternalid,oldExternalid);
    		}  		
    	}
    }

    function saveRecord(printJobRec,newExternalid,oldExternalid){
    	try{
    		if(oldExternalid != newExternalid){			
    			printJobRec.setValue({
        			fieldId:'externalid',
        			value:newExternalid
        		}).save({
        			enableSourcing:false,
        			ignoreMandatoryFields:true
        		});
    		}
    	}catch(e){
    		log.debug('exception raised record after submit',e)
    	}
    }
    

    return {
        afterSubmit: overwriteExternalid
    };
    
});
