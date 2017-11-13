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
			var empId = context.getText({
				fieldId : 'ownerid',
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

			var today = new Date();
			var dd = today.getDate();
			var mm = today.getMonth()+1; //January is 0!
			var yyyy = today.getFullYear();

			if(dd<10) {
				dd = '0'+dd
			} 
			if(mm<10) {
				mm = '0'+mm
			}
			today = mm + '/' + dd + '/' + yyyy;
			log.debug('today',today);

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


			if(today == leaveStartDate){
				log.debug('Hello','Triggered If Condition');
				var objLeavesTaken = objEmpRecord.setValue({
					fieldId: 'custentitycpm_leavestaken',
					value: totalLeaves
				});
				log.debug('objLeavesTaken',objLeavesTaken);
				var recordId = objEmpRecord.save({
					enableSourcing: true,
					ignoreMandatoryFields: true
				});
			}





		}catch(e){
			log.debug(e.name,e.message);
		}

	}

	return {
		onAction : onAction
	};

});
