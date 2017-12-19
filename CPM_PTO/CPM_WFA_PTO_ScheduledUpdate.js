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
			var context = scriptContext.newRecord;
			log.debug('context',context);
			// Getting Employee ID and leaveDuration from Context
			var empId = context.getValue({
				fieldId : 'custrecord_cpm_parent',
			});
			var leaveDuration = context.getValue({
				fieldId : 'custrecord_cpm_leave_duration',
			});
			var leaveStartDate = context.getText({
				fieldId : 'custrecordleave_cpm_str',
			});

			var leaveEndDate = context.getText({
				fieldId : 'custrecord_cpm_end',
			});

			var datecreated = context.getText({
				fieldId : 'created',
			});
			var pending =  context.getText({
				fieldId: 'custrecord_cpm_empleave_approvals'
			});
			log.debug('pending',pending);


			var objEmpRecord = record.load({
				type: record.Type.EMPLOYEE,
				id: empId,
				isDynamic: true,
			});


			// Getting Number of leaves taken from loaded Employee Record
			var numberOfLeaves = objEmpRecord.getValue({
				fieldId: 'custentitycpm_leavestaken'
			}); 

			var totalLeaves = parseFloat(numberOfLeaves) + parseFloat(leaveDuration);

			var objLeavesTaken = objEmpRecord.setValue({
				fieldId: 'custentitycpm_leavestaken',
				value: totalLeaves
			});		
			var recordId = objEmpRecord.save({
				enableSourcing: true,
				ignoreMandatoryFields: true
			});

		}catch(e){
			log.debug(e.name,e.message);
		}

	}

	return {
		onAction : onAction
	};

});
