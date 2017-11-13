/**
 * @NApiVersion 2.x
 * @NScriptType workflowactionscript
 */
define(['N/record','N/search'],

		function(record,search) {

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
			var objRecord;
			var customerRecord = scriptContext.newRecord;
			var Id = customerRecord.id;
			var empId = customerRecord.getValue({
				fieldId : 'custrecord_cpm_parent',
			});
			log.debug('empId',empId);
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
			var leaveDuration = customerRecord.getValue({
				fieldId : 'custrecord_cpm_leave_duration',
			});
			var leaveStartDate = customerRecord.getText({
				fieldId : 'custrecordleave_cpm_str',
			});
			var Empid = customerRecord.getValue({
				fieldId : 'custrecord_cpm_parent',
			});
			var leaveEndDate = customerRecord.getText({
				fieldId : 'custrecord_cpm_end',
			});
			var EndHalfday = customerRecord.getValue({
				fieldId : 'custrecord_cpm_endday_leave',
			});
			var pending =  customerRecord.getText({
				fieldId: 'custrecord_cpm_empleave_approvals'
			});
			log.debug('pending',pending);

			var DateArr = getDates(new Date(),leaveEndDate);
			log.debug('Dates',DateArr);
			log.debug('DateArr',DateArr.length);
			var diffDays = DateArr.length;			
			if(pending == 'Approved'){
				 objRecord = record.load({
					type: record.Type.EMPLOYEE, 
					id: Empid,
					isDynamic: true,
				});

				log.debug('EMPRECORD',objRecord);
				var numberOfLeaves = objRecord.getValue({
					fieldId: 'custentitycpm_leavestaken'
				}); 
				var deduction = parseFloat(numberOfLeaves) - parseFloat(diffDays);
              log.debug('deduction',deduction);
				if((new Date(leaveStartDate) <= new Date()) &&(new Date() <= new Date(leaveEndDate))){
					if(EndHalfday == true){
						var numberOfLeaves = objRecord.setValue({
							fieldId: 'custentitycpm_leavestaken',
							value: deduction + parseFloat(0.5)
						}); 
					}
					else{
						var numberOfLeaves = objRecord.setValue({
							fieldId: 'custentitycpm_leavestaken',
							value: deduction
						});

					}					
					var recordId = objRecord.save({
						enableSourcing: true,
						ignoreMandatoryFields: true
					});


				}
			}
			var createdSearch = search.create({
				type:search.Type.CALENDAR_EVENT ,	
				columns:['starttime'],
				filters:['custevent_cpm_pto_id','anyof',customerRecord.id]
			}).run().getRange(0,10);
			log.debug('createdSearch',createdSearch[0].id);
			var eventId = createdSearch[0].id;
			eventRecord = record.load({
				type: record.Type.CALENDAR_EVENT, 
				id: eventId,
				isDynamic: true
			});
			var today =new Date();
			eventRecord.setValue({
				fieldId: 'frequency',
				value: 'DAY',
				ignoreFieldChange: true
			});
			eventRecord.setValue({
				fieldId: 'period',
				value: '1',
				ignoreFieldChange: true
			});
			eventRecord.setValue({
				fieldId: 'endbydate',
				value: today,
				ignoreFieldChange: true
			});
			var recordId = eventRecord.save({
				enableSourcing: true,
				ignoreMandatoryFields: true
			});


		}catch(e){
			log.debug(e.name,e.message);
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
