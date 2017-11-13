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
	var holidays;
	var holidayarr;
	function onAction(scriptContext) {
		try{
			var ptoObj = scriptContext.newRecord;
			log.debug('ptoObj',ptoObj);
			// Getting Employee ID and leaveDuration from ptoObj
			var empId = ptoObj.getValue({
				fieldId : 'custrecord_cpm_parent'
			});
			var empname = ptoObj.getText({
				fieldId : 'custrecord_cpm_parent'
			});
			log.debug('empId',empId);
			holidays = ptoObj.getValue({
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
			var leaveDuration = ptoObj.getValue({
				fieldId : 'custrecord_cpm_leave_duration'
			});
			var leaveStartDate = ptoObj.getText({
				fieldId : 'custrecordleave_cpm_str'
			});
			log.debug('leaveStartDate',new Date(leaveStartDate));

			var leaveEndDate = ptoObj.getText({
				fieldId : 'custrecord_cpm_end'
			});
			log.debug('leaveEndDate',leaveEndDate);


			var DateArr = getDates(leaveStartDate, leaveEndDate);
			log.debug('DateArr',DateArr);

			var objEmpRecord = record.load({
				type: record.Type.EMPLOYEE,
				id: empId,
				isDynamic: false
			});
			var numberOfLeaves = objEmpRecord.getValue({
				fieldId: 'custentitycpm_leavestaken'
			});
			var totalLeaves = parseFloat(numberOfLeaves) + parseFloat(leaveDuration);

			if(new Date() >= new Date(leaveStartDate)){
				objEmpRecord.setValue({
					fieldId: 'custentitycpm_leavestaken',
					value: totalLeaves,
					ignoreFieldChange: true					
				});
				log.debug('numberOfLeaves',numberOfLeaves);
			}
			var recordId = objEmpRecord.save({
				enableSourcing: true,
				ignoreMandatoryFields: true
			});


			// Saving Employee Record


			var eventRecord = record.create({
				type: record.Type.CALENDAR_EVENT, 
				isDynamic: true
			});
			eventRecord.setValue({
				fieldId: 'title',
				value: empname+'On Vacation',
				ignoreFieldChange: true
			});
			eventRecord.setValue({
				fieldId: 'custevent_cpm_pto_id',
				value: ptoObj.id,
				ignoreFieldChange: true
			});

			eventRecord.setValue({
				fieldId: 'startdate',
				value: new Date(leaveStartDate),
				ignoreFieldChange: true
			});
			eventRecord.setValue({
				fieldId: 'timedevent',
				value: false,
				ignoreFieldChange: true
			});
			eventRecord.setValue({
				fieldId: 'frequency',
				value: 'DAY'				
			});
			eventRecord.setValue({
				fieldId: 'period',
				value: '1',
				ignoreFieldChange: true
			});

			eventRecord.setValue({
				fieldId: 'endbydate',
				value: new Date(leaveEndDate),
				ignoreFieldChange: true
			});
			var recordId = eventRecord.save({
				enableSourcing: false,
				ignoreMandatoryFields: true
			});
			log.debug('eventRecord',eventRecord);

		}
		catch(ex){
			log.debug(ex.name,ex);
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
		onAction : onAction
	};

});
