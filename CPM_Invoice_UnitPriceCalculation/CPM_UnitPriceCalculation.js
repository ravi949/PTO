/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       03 Nov 2016     CPM				Script to automatically calculate the rate of line item	
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord invoice
 * @appliedtorecord salesorder
 * 
 * @param {String} type Operation types: create, edit, delete, xedit
 *                      approve, reject, cancel (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF)
 *                      markcomplete (Call, Task)
 *                      reassign (Case)
 *                      editforecast (Opp, Estimate)
 * @returns {Void}
 */
function beforeSubmit_unitPrice(type){
	//nlapiLogExecution('DEBUG', 'BS_Type', type);
	if (type != 'create' && type != 'edit') return;
	try {
		var rec = nlapiGetNewRecord();
		var lines = rec.getLineItemCount('item');
		for (var i = 0; i < lines; i++){
			rec.selectLineItem('item', i+1);
			if (rec.getRecordType()=='invoice'){
				var rate = rec.getCurrentLineItemValue('item', 'rate');
				var priceLevel = rec.getCurrentLineItemValue('item', 'price');
				if (rate != null && priceLevel != -1) return;
			}
          var amount = rec.getCurrentLineItemValue('item', 'amount');
			var calc = parseFloat(rec.getCurrentLineItemValue('item', 'amount'))/parseFloat(rec.getCurrentLineItemValue('item', 'quantity'));
			rec.setCurrentLineItemValue('item', 'rate', calc.toFixed(6));
			//nlapiLogExecution('DEBUG', 'LineRate', rec.getCurrentLineItemValue('item', 'rate'));
          rec.setCurrentLineItemValue('item', 'amount', amount);
			rec.commitLineItem('item', true);
		}
	} catch(ex){
		nlapiLogExecution('ERROR', ex.name, ex.message);
	}
	//nlapiLogExecution('DEBUG', 'BS', 'Ended');
}