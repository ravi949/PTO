/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record'],

		function(record) {

	/**
	 * Function definition to be triggered before record is loaded.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.newRecord - New record
	 * @param {string} scriptContext.type - Trigger type
	 * @param {Form} scriptContext.form - Current form
	 * @Since 2015.2
	 */
	var holidays;
	var holidayarr;

	function beforeLoad(scriptContext) {

	}

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


	}

	/**
	 * Function definition to be triggered before record is loaded.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.newRecord - New record
	 * @param {Record} scriptContext.oldRecord - Old record
	 * @param {string} scriptContext.type - Trigger type
	 * @Since 2015.2
	 */
	function afterSubmit(scriptContext) {
		if(scriptContext.type == 'delete'){
			log.debug('values','values');
			var customerRecord = scriptContext.newRecord;
			var Id = customerRecord.id;
			var empId = customerRecord.getText({
				fieldId : 'ownerid',
			});
			holidays = customerRecord.getValue({
				fieldId : 'custrecord_cpm_leave_hldays'
			});
			holidayarr = holidays.replace(/\n/ig, ',').trim();
			holidayarr = holidayarr.split(',');
			var dates,objDate;

			for(var i = 0 ; i <= holidayarr.length-1; i++){

				objDate = new Date(holidayarr[i]);
				dates = objDate.getDay();

				if(dates == 0 || dates == 6){
					holidayarr.splice(i,1);
				}
			}
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
			var leaveDuration = customerRecord.getValue({
				fieldId : 'custrecord_cpm_leave_duration',
			});
			var leaveStartDate = customerRecord.getText({
				fieldId : 'custrecordleave_cpm_str',
			});
			log.debug('leaveStartDate',leaveStartDate);
			var Empid = customerRecord.getValue({
				fieldId : 'custrecord_cpm_parent',
			});
			log.debug('Empname',Empid);

			var leaveEndDate = customerRecord.getText({
				fieldId : 'custrecord_cpm_end',
			});
			log.debug('leaveEndDate',leaveEndDate);		
			var EndHalfday = customerRecord.getValue({
				fieldId : 'custrecord_cpm_endday_leave',
			});
			log.debug('EndHalfday',EndHalfday);
			var pending =  customerRecord.getText({
				fieldId: 'custrecord_cpm_empleave_approvals'
			});
			log.debug('pending',pending);			
			var DateArr = getDates(today,leaveEndDate);
			log.debug('DateArr',DateArr);
//			var end = new Date(enddate);
//			var end1 = new Date(today);
//			var timeDiff = Math.abs(end.getTime() - end1.getTime());
//			var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
			log.debug('DateArr',DateArr.length);
			var diffDays = (DateArr.length)-1;
			if(pending == 'Approved'){
				var objRecord = record.load({
					type: record.Type.EMPLOYEE, 
					id: Empid,
					isDynamic: true,
				});

				log.debug('EMPRECORD',objRecord);
				var numberOfLeaves = objRecord.getValue({
					fieldId: 'custentitycpm_leavestaken'
				}); 
				//var deduction = numberOfLeaves - diffDays;
				//var addition = numberOfLeaves - leaveDuration;
//				if(leaveStartDate > today){
//					var numberOfLeaves = objRecord.setValue({
//						fieldId: 'custentitycpm_leavestaken',
//						value: parseFloat(leaveDuration) + parseFloat(numberOfLeaves)
//					});
//				}
//				if((leaveStartDate <= today) &&(today <= leaveEndDate)){
//					if(EndHalfday == true){
//						var numberOfLeaves = objRecord.setValue({
//							fieldId: 'custentitycpm_leavestaken',
//							value: deduction + parseFloat(0.5)
//						}); 
//					}
//					else{
//						var numberOfLeaves = objRecord.setValue({
//							fieldId: 'custentitycpm_leavestaken',
//							value: deduction
//						});
//						
//					}
//				}
//				else{
//					var numberOfLeaves = objRecord.setValue({
//						fieldId: 'custentitycpm_leavestaken',
//						value: addition
//					}); 
//				}

				var recordId = objRecord.save({
					enableSourcing: true,
					ignoreMandatoryFields: true
				});
				log.debug('DateArr',DateArr);
			}

		}

	}
	function getDates(startDate, stopDate) {
		try{

			var startdate = new Date(startDate);
			var endDate = new Date(stopDate);

			var dateArray = new Array();
			var currentDate = startdate;

			while (currentDate <= endDate) {
				if(currentDate.getDay() == 6 || currentDate.getDay() == 0){
					currentDate = new Date(startdate.setDate(startdate.getDate() + 1));//startDate.addDays(1)
				}
				else{
					var convertedDate = convert(currentDate.toString());			
					dateArray.push(convertedDate);
					currentDate = new Date(startdate.setDate(startdate.getDate() + 1));
				}
			}
			dateArray = dateArray.filter(function(val) {
				return holidayarr.indexOf(val) == -1;
			});

			return dateArray;
		}
		catch(ex){
			log.debug(ex.name,ex.message);
		}
	}
	function convert(str) {
		var date = new Date(str),
		mnth = ("0" + (date.getMonth()+1)).slice(-2),
		day  = ("0" + date.getDate()).slice(-2);
		return [ mnth, day ,date.getFullYear() ].join("/");
	}

	return {     
		beforeLoad:beforeLoad,
		afterSubmit: afterSubmit
	};

});
