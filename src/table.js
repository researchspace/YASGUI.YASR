var $ = require("jquery");
require("./../lib/DataTables/media/js/jquery.dataTables.js");
var imgs = require("./imgs");

var root = module.exports = function(yasr,parent, options) {
	var plugin = {};
	plugin.options = $.extend(true, {}, root.defaults, options);
	plugin.yasr = yasr;
	plugin.parent = parent;
	plugin.draw = function() {
		root.draw(plugin);
	};
	
	return plugin;
};

root.draw = function(plugin) {
	plugin.table = $('<table cellpadding="0" cellspacing="0" border="0" class="resultsTable"></table>');
	$(plugin.parent).html(plugin.table);

	var dataTableConfig = plugin.options.datatable;
	dataTableConfig.aaData = getRows(plugin);
	dataTableConfig.aoColumns = getVariablesAsCols(plugin),
	plugin.table.dataTable(dataTableConfig); 
	
	
	drawSvgIcons(plugin);
	
	addEvents(plugin);
	
	if (plugin.yasr.header.find(".yasr_btnGroup").is(':visible')) {
		//in that case, move the table upward, so the table options nicely align with the selector
		plugin.yasr.container.find(".dataTables_wrapper")
			.css("position", "relative")
			.css("top", "-30px");
	}
};


var getVariablesAsCols = function(plugin) {
	var cols = [];
	cols.push({"sTitle": ""});//row numbers
	var sparqlVars = plugin.yasr.results.getVariables();
	for (var i = 0; i < sparqlVars.length; i++) {
		cols.push({"sTitle": sparqlVars[i]});
	}
	return cols;
};

var getRows = function(plugin) {
	var rows = [];
	var bindings = plugin.yasr.results.getBindings();
	var vars = plugin.yasr.results.getVariables();
	for (var rowId = 0; rowId < bindings.length; rowId++) {
		var row = [];
		row.push("");//row numbers
		var binding = bindings[rowId];
		for (var colId = 0; colId < vars.length; colId++) {
			var sparqlVar = vars[colId];
			if (sparqlVar in binding) {
				if (plugin.options.drawCellContent) {
					row.push(plugin.options.drawCellContent(rowId, colId, binding[sparqlVar]));
				} else {
					row.push("");
				}
			} else {
				row.push("");
			}
		}
		rows.push(row);
	}
	return rows;
};

root.getFormattedValueFromBinding = function(rowId, colId, binding) {
	var value = null;
	if (binding.type == "uri") {
		value = "<a class='uri' href='#'>" + binding.value + "</a>";
	} else {
		value = "<span class='nonUri'>" + binding.value + "</span>";
	}
	return value;
};
var getExternalLinkElement = function() {
	var element = $("#externalLink");
	if (element.length == 0) {
		element = $("<img id='externalLink' src='" + Yasgui.constants.imgs.externalLink.get() + "'></img>")
			.on("click", function(){
				window.open($(this).parent().text());
			});
	}
	return element;
};
var executeSnorqlQuery = function(uri) {
	console.log("exec snorql");
//	var newQuery = Yasgui.settings.defaults.tabularBrowsingTemplate;
//	newQuery = newQuery.replace(/<URI>/g, "<" + uri + ">");
//	Yasgui.settings.getCurrentTab().query = newQuery;
//	Yasgui.tabs.getCurrentTab().cm.reloadFromSettings();
//	Yasgui.sparql.query();
};

var addEvents = function(plugin) {
	plugin.table.on( 'order.dt', function () {
	    drawSvgIcons(plugin);
	});
	
	plugin.table.delegate("td", "click", function() {
		if (plugin.options.handlers && plugin.options.handlers.onCellClick) {
			var result = plugin.options.handlers.onCellClick(this);
			if (result === false) return false;
		}
//		console.log("click uri");
//		executeSnorqlQuery(this.innerHTML);
//		return false;
	}).delegate("td",'mouseenter', function(event) {
		if (plugin.options.handlers && plugin.options.handlers.onCellMouseEnter) {
			plugin.options.handlers.onCellMouseEnter(this);
		}
//		var extLinkElement = getExternalLinkElement();
//		$(this).append(extLinkElement);
//		extLinkElement.css("top", ($(this).height() - extLinkElement.height() / 2)); 
//		extLinkElement.show();
	}).delegate("td",'mouseleave', function(event) {
		if (plugin.options.handlers && plugin.options.handlers.onCellMouseLeave) {
			plugin.options.handlers.onCellMouseLeave(this);
			
		}
//		getExternalLinkElement().hide();
	});
};

var drawSvgIcons = function(plugin) {
	var sortings = {
		"sorting": "unsorted",
		"sorting_asc": "sortAsc",
		"sorting_desc": "sortDesc"
	};
	plugin.table.find(".sortIcons").remove();
	for (var sorting in sortings) {
		var svgDiv = $("<div class='sortIcons'></div>").css("float", "right").css("margin-right", "-12px").width(10).height(15);
		imgs.draw(svgDiv, {id: sortings[sorting], width: 12, height: 16});
		plugin.table.find("th." + sorting).append(svgDiv);
	}
};
root.openCellUriInNewWindow = function(cell) {
	if (cell.className.indexOf("uri") >= 0) {
		window.open(this.innerHTML);
	}
};

root.defaults = {
	name: "Table",
	canHandleResults: function(yasr){return yasr.results.getVariables().length > 0;},
	getPriority: function(yasr){return 10;},
	drawCellContent: root.getFormattedValueFromBinding,
//	associativeBrowsingTemplate: function(uri) {
//		return 'SELECT ?property ?hasValue ?isValueOf\n' + 
//				'WHERE {	{ <http://www.openlinksw.com/virtrdf-data-formats#default-iid-nullable> ?property ?hasValue	}\n' +
//				'UNION	{ ?isValueOf ?property <http://www.openlinksw.com/virtrdf-data-formats#default-iid-nullable> }\n' +
//				'}';
//	},
	handlers: {
		onCellMouseEnter: function(cell) {
			console.log("mouse enter");
		},
		onCellMouseLeave: function(cell) {
			console.log("mouse leave");
		},
		onCellClick: root.openCellUriInNewWindow
	},
	datatable: {
		"aaSorting": [],//disable initial sorting
		"iDisplayLength": 50,//default page length
    	"aLengthMenu": [[10, 50, 100, 1000, -1], [10, 50, 100, 1000, "All"]],//possible page lengths
    	"bLengthChange": true,//allow changing page length
    	"sPaginationType": "full_numbers",//how to show the pagination options
        "fnDrawCallback": function ( oSettings ) {
        	//trick to show row numbers
        	for ( var i = 0; i < oSettings.aiDisplay.length; i++) {
				$('td:eq(0)',oSettings.aoData[oSettings.aiDisplay[i]].nTr).html(i + 1);
			}
        	
        	//Hide pagination when we have a single page
        	var activePaginateButton = false;
        	$(oSettings.nTableWrapper).find(".paginate_button").each(function() {
        		if ($(this).attr("class").indexOf("current") == -1 && $(this).attr("class").indexOf("disabled") == -1) {
        			activePaginateButton = true;
        		}
        	});
        	if (activePaginateButton) {
        		$(oSettings.nTableWrapper).find(".dataTables_paginate").show();
        	} else {
        		$(oSettings.nTableWrapper).find(".dataTables_paginate").hide();
        	}
		},
		"aoColumnDefs": [
			{ "sWidth": "12px", "bSortable": false, "aTargets": [ 0 ] }//disable row sorting for first col
		],
	},
};