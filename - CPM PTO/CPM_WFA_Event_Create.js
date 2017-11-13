/**
 * @NApiVersion 2.x
 * @NScriptType workflowactionscript
 */
define(['N/record'],

		function(record) {

	/**
	 * Definition of the Suitelet script trigger point.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.newRecord - New record
	 * @param {Record} scriptContext.oldRecord - Old record
	 * @Since 2016.1
	 */
	function onAction(scriptContext) {
		try{
			var EventRecord = record.create({
				type: record.Type.CALENDAR_EVENT, 
				isDynamic: true
			});
			EventRecord.setValue({
				fieldId: 'title',
				value: empname,
				ignoreFieldChange: true
			});

			EventRecord.setValue({
				fieldId: 'startdate',
				value: new Date(leaveStartDate),
				ignoreFieldChange: true
			});
			EventRecord.setValue({
				fieldId: 'frequency',
				value: 'DAY'				
			});
			EventRecord.setValue({
				fieldId: 'period',
				value: '1',
				ignoreFieldChange: true
			});

			EventRecord.setValue({
				fieldId: 'endbydate',
				value: new Date(leaveEndDate),
				ignoreFieldChange: true
			});
			var recordId = EventRecord.save({
				enableSourcing: false,
				ignoreMandatoryFields: true
			});
			log.debug('EventRecord',EventRecord);
		}catch(e){
			log.debug(e.name,e.message);
		}

	}

	return {
		onAction : onAction
	};

});
