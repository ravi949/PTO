/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/ui/dialog'],

function(dialog) {
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
    	var fileNameArr = jQuery('[name="custpage_up_file"]').val().split('.'),
    	fileName = fileNameArr[fileNameArr.length-1],
    	success = ['csv','xlsx'].some(function(e){return e == fileName});
    	if(!success){
    		 dialog.alert({
    	       title: 'Alert',
    	       message: '<h5>Invalid file format.</h5>' 
    	     });
    	}
    	return success;
    }
    
    function redirectToBack(){
      history.go(-1);	
    }

    return {
        saveRecord: saveRecord,
        redirectToBack:redirectToBack
    };
    
});
