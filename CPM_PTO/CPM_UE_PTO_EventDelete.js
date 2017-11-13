/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/search'],

		function(record,search) {
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
		var customerRecord = scriptContext.newRecord;
		   	

		if(scriptContext.type == 'delete'){
			var pending =  customerRecord.getText({
				fieldId: 'custrecord_cpm_empleave_approvals'
			});
			if(pending == 'Approved'){

				var createdSearch = search.create({
					type:search.Type.CALENDAR_EVENT ,	
					columns:['starttime'],
					filters:['custevent_cpm_pto_id','anyof',scriptContext.newRecord.id]
				}).run().getRange(0,10);
				log.debug('createdSearch',createdSearch[0].id);
				var eventId = createdSearch[0].id;					
				record.delete({
					type: record.Type.CALENDAR_EVENT, 
					id: eventId,
				});			
			}
		}
	}
	return {
		beforeSubmit: beforeSubmit        
	};

});
