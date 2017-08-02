/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/ui/message','N/ui/dialog'],
/**
 * @param {record} record
 * @param {search} search
 * @param {message} message
 */
function(record, search, message, dialog) {
   
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
	function pageInit(scriptContext) {
		var rec = scriptContext.currentRecord,
		printjobId = rec.getValue('createdfrom');    		
		if(printjobId){  
			var haveEstimateRecords = fromPJorNot(printjobId);
			if(haveEstimateRecords){
				console.log('coming in pageinit');
				var myMsg = message.create({
					title: "ERROR", 
					message: "An Invoice cannot be created directly as there are Estimates associated to this Print Job", 
					type: message.Type.ERROR
				});
				myMsg.show();
			}     	
		}
	}

    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
	function saveRecord(scriptContext) {
		var rec = scriptContext.currentRecord,
		printjobId = rec.getValue('createdfrom');    		
		if(printjobId){  
			var haveEstimateRecords = fromPJorNot(printjobId);
			if(haveEstimateRecords){
				dialog.alert({ 
					title: "Error",
					message: "An Invoice cannot be created directly as there are Estimates associated to this Print Job"
				});
				return false;
			} else
				return true;    	
		}else
			return true;

	}

    function fromPJorNot(printjobId){  
    	var printjobRec = search.create({
    		type:search.Type.OPPORTUNITY,
    		columns: ['internalid'],
    		filters: [['internalid','is',printjobId]]
    	}).run().getRange(0,10);
    	//checking the record whether it is created from Print Job or not
    	if(printjobRec.length > 0){
    		//getting the Estimate records list
    		var estimateRecords = search.create({
    			type:search.Type.ESTIMATE,
    			columns: ['internalid'],
    			filters: [['opportunity','is',printjobId],'and',['mainline','is','T']]
    		}).run().getRange(0,10);
    		//condition triggers when creating an Invoice from Print Job
    		if(estimateRecords.length > 0){
    			return true;
    		} else
    			return false;
    	} else
    		return false;
    }

    return {
        pageInit: pageInit,
        saveRecord:saveRecord
    };
    
});
