/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */



define(['N/currentRecord','N/https'],

		function(currentRecord,https) {

	/**
	 * Function to be executed after page is initialized.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.currentRecord - Current form record
	 * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
	 *
	 * @since 2015.2
	 */
	var holidays;
	var holidayarr;
	function pageInit(scriptContext) {
		try{
			var record = scriptContext.currentRecord;
			holidays = record.getValue({
				fieldId : 'custrecord_cpm_leave_hldays'
			});
			//console.log('holidays',holidays);

			holidayarr = holidays.replace(/\n/ig, ',').trim();
			holidayarr = holidayarr.split(',');
			var dates,objDate;
			//console.log(holidayarr);
			for(var i = 0 ; i <= holidayarr.length-1; i++){

				objDate = new Date(holidayarr[i]);
				dates = objDate.getDay();

				if(dates == 0 || dates == 6){
					holidayarr.splice(i,1);
				}
			}
			//console.log("Holidays"+holidayarr);
		}
		catch(ex){
			console.log(ex.name,ex.message);
		}
	}

	/**
	 * Function to be executed when field is changed.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.currentRecord - Current form record
	 * @param {string} scriptContext.sublistId - Sublist name
	 * @param {string} scriptContext.fieldId - Field name
	 * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
	 * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
	 *
	 * @since 2015.2
	 */
	function fieldChanged(scriptContext) {
		//console.log('hello')
		try{

			var record = scriptContext.currentRecord;
			var endDate;
			var startDate;
			var chkLeaveDurationstart;
			var chkLeaveDurationend;
			var dates;


			if(scriptContext.fieldId === 'custrecordleave_cpm_str' || scriptContext.fieldId === 'custrecord_cpm_end'){
				startDate = record.getText({
					fieldId : 'custrecordleave_cpm_str'
				});
				
				endDate = record.getText({
					fieldId : 'custrecord_cpm_end'
				});

				var objStartDate = new Date(startDate);
				var objEndDate = new Date(endDate);

				var startday = objStartDate.getDay();
				var endday = objEndDate.getDay();

				var pHolidays = holidays.replace(/\n/ig, ',').trim();
				var pHolidaysarr = [];


				pHolidaysarr = pHolidays.split(',');

				//record.getField('custrecord_cpm_half_leave').isDisabled = pHolidaysarr.some(function(e){return e == startDate});
				//record.getField('custrecord_cpm_endday_leave').isDisabled = pHolidaysarr.some(function(e){return e == endDate});


				if(pHolidaysarr.some(function(e){return e == startDate})){
					alert('You selected Leave start date on Holiday');
					record.setText({
						fieldId : 'custrecordleave_cpm_str', 
						value : ' '
					});
				}
				if(pHolidaysarr.some(function(e){return e == endDate})){
					alert('You selected Leave End date on Holiday');
					record.setText({
						fieldId : 'custrecord_cpm_end', 
						value : ' '
					});
				}

				if(startday == 0 || startday == 6){
					alert('Cannot be saturday or sunday');
					record.setText({
						fieldId : 'custrecordleave_cpm_str', 
						value : ' '
					});

					record.setText({
						fieldId : 'custrecord_cpm_leave_duration', 
						value : ' '
					});
				}

				if(endday == 0 || endday == 6){
					alert('Cannot be saturday or sunday');
					record.setText({
						fieldId : 'custrecord_cpm_end', 
						value : ' '
					});

					record.setText({
						fieldId : 'custrecord_cpm_leave_duration', 
						value : ' '
					});
				}

				if (objEndDate < objStartDate){ 
					alert('Invalid End Date');
					record.setText({
						fieldId : 'custrecord_cpm_end', 
						value : ' '
					});
				}
			}

			if(scriptContext.fieldId === 'custrecordleave_cpm_str' || scriptContext.fieldId === 'custrecord_cpm_end' || scriptContext.fieldId === 'custrecord_cpm_half_leave' || scriptContext.fieldId === 'custrecord_cpm_endday_leave'){
				startDate = record.getText({
					fieldId : 'custrecordleave_cpm_str'
				});

				endDate = record.getText({
					fieldId : 'custrecord_cpm_end'
				});

				chkLeaveDurationstart = record.getValue({
					fieldId : 'custrecord_cpm_half_leave'
				});

				chkLeaveDurationend = record.getValue({
					fieldId : 'custrecord_cpm_endday_leave'
				});

				if(startDate && endDate){
					var objStartDate = new Date(startDate);
					var objEndDate = new Date(endDate);

					var LeaveDuration = calcBusinessDays(objStartDate,objEndDate);
					var holidayLeaves = leaveCalculation(objStartDate, objEndDate);
					console.log("Difference Leaves = "+holidayLeaves);

					LeaveDuration = LeaveDuration - holidayLeaves;

					if(chkLeaveDurationstart){
						console.log("Leave Duration Start");
						record.setValue({
							fieldId: 'custrecord_cpm_leave_duration',
							value: LeaveDuration - 0.5
						});

					}

					if(chkLeaveDurationend){
						console.log("Leave Duration End");
						record.setValue({
							fieldId: 'custrecord_cpm_leave_duration',
							value: LeaveDuration - 0.5
						});
					}

					if(chkLeaveDurationstart && chkLeaveDurationend){
						console.log("Leave Duration Start End");
						record.setValue({
							fieldId: 'custrecord_cpm_leave_duration',
							value: LeaveDuration - 1
						});
					}

					if(!chkLeaveDurationstart && !chkLeaveDurationend){
						record.setValue({
							fieldId: 'custrecord_cpm_leave_duration',
							value: LeaveDuration
						});
					}
				}

				dates = getDates(objStartDate, objEndDate);
				console.log(dates);
			}
		}

		catch(ex){
			log.debug(ex.name,ex.message);
		}
	}


	function getDates(startDate, stopDate) {
		try{
			console.log('function get days activated');
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
			console.log(ex.name,ex.message);
		}
	}

	function convert(str) {
		var date = new Date(str),
		mnth = ("0" + (date.getMonth()+1)).slice(-2),
		day  = ("0" + date.getDate()).slice(-2);
		return [ mnth, day ,date.getFullYear() ].join("/");
	}


	function calcBusinessDays(objStartDate, objEndDate) { // input given as Date objects
		try{
			var iWeeks, iDateDiff, iAdjust = 0;
			if (objEndDate < objStartDate){ 

				return -1;
			} // error code if dates transposed
			var iWeekday1 = objStartDate.getDay(); // day of week
			var iWeekday2 = objEndDate.getDay();
			iWeekday1 = (iWeekday1 == 0) ? 7 : iWeekday1; // change Sunday from 0 to 7
			iWeekday2 = (iWeekday2 == 0) ? 7 : iWeekday2;
			if ((iWeekday1 > 5) && (iWeekday2 > 5)) iAdjust = 1; // adjustment if both days on weekend
			iWeekday1 = (iWeekday1 > 5) ? 5 : iWeekday1; // only count weekdays
			iWeekday2 = (iWeekday2 > 5) ? 5 : iWeekday2;

			// calculate differnece in weeks (1000mS * 60sec * 60min * 24hrs * 7 days = 604800000)
			iWeeks = Math.floor((objEndDate.getTime() - objStartDate.getTime()) / 604800000);

			if (iWeekday1 <= iWeekday2) {
				iDateDiff = (iWeeks * 5) + (iWeekday2 - iWeekday1);
			} else {
				iDateDiff = ((iWeeks + 1) * 5) - (iWeekday1 - iWeekday2);
			}

			iDateDiff -= iAdjust; // take into account both days on weekend

			return (iDateDiff + 1); // add 1 because dates are inclusive
		}
		catch(ex){
			log.debug(ex.name,ex.message);
		}
	}


	function leaveCalculation(d1, d2) {
		var holidayArr = [];
		if ( d2 < d1 ) return -1;

		var oneDay = 24*60*60*1000;
		var difDays = Math.round(Math.abs((d1.getDay() - d2.getDay())/(oneDay))); //find the number of days between the two dates
		//var holidayArr = holidayarr.split(','); //split at ,
		var holidaydate;
		for(var i=0; i<holidayarr.length;i++){ //loop through array
			holidaydate = new Date(holidayarr[i]);
			if(holidaydate <= d2 && holidaydate >= d1){ //check if two dates are between the given dates
				difDays+=1;
			}
		}
		return difDays;
	}


	/**
	 * Function to be executed when field is slaved.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.currentRecord - Current form record
	 * @param {string} scriptContext.sublistId - Sublist name
	 * @param {string} scriptContext.fieldId - Field name
	 *
	 * @since 2015.2
	 */
	function postSourcing(scriptContext) {

	}

	/**
	 * Function to be executed after sublist is inserted, removed, or edited.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.currentRecord - Current form record
	 * @param {string} scriptContext.sublistId - Sublist name
	 *
	 * @since 2015.2
	 */
	function sublistChanged(scriptContext) {

	}

	/**
	 * Function to be executed after line is selected.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.currentRecord - Current form record
	 * @param {string} scriptContext.sublistId - Sublist name
	 *
	 * @since 2015.2
	 */
	function lineInit(scriptContext) {

	}

	/**
	 * Validation function to be executed when field is changed.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.currentRecord - Current form record
	 * @param {string} scriptContext.sublistId - Sublist name
	 * @param {string} scriptContext.fieldId - Field name
	 * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
	 * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
	 *
	 * @returns {boolean} Return true if field is valid
	 *
	 * @since 2015.2
	 */
	function validateField(scriptContext) {
	}

	/**
	 * Validation function to be executed when sublist line is committed.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.currentRecord - Current form record
	 * @param {string} scriptContext.sublistId - Sublist name
	 *
	 * @returns {boolean} Return true if sublist line is valid
	 *
	 * @since 2015.2
	 */
	function validateLine(scriptContext) {

	}

	/**
	 * Validation function to be executed when sublist line is inserted.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.currentRecord - Current form record
	 * @param {string} scriptContext.sublistId - Sublist name
	 *
	 * @returns {boolean} Return true if sublist line is valid
	 *
	 * @since 2015.2
	 */
	function validateInsert(scriptContext) {

	}

	/**
	 * Validation function to be executed when record is deleted.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.currentRecord - Current form record
	 * @param {string} scriptContext.sublistId - Sublist name
	 *
	 * @returns {boolean} Return true if sublist line is valid
	 *
	 * @since 2015.2
	 */
	function validateDelete(scriptContext) {
	
		
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

	}

	return {
		pageInit: pageInit,
		fieldChanged:fieldChanged
	};

});
