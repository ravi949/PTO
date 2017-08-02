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
     * @param {Object} sc
     * @param {Record} sc.newRecord - New record
     * @param {string} sc.type - Trigger type
     * @param {Form} sc.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(sc) {
    	try{
    		if (sc.type != sc.UserEventType.VIEW) return;
        	var btn_deposit = sc.form.addButton({
        		id: 'custpage_cpm_depositbutton',
        		label: 'Job Deposit',
        		functionName: 'cpm_printdeposit(' + sc.newRecord.id +')'
        	});
        	sc.form.clientScriptModulePath = './cpm_attach_salesorder_printdeposit.js';
    	} catch(ex) {
    		log.error('UE_BeforeLoad_Error', ex.name + '; message: ' + ex.message + '; id: ' + sc.newRecord.id);
    	}
    }

    return {
        beforeLoad: beforeLoad
    };
    
});
