// Variable Declarations //

var apptStart, apptEnd;
var localStore = "CALPerbole";


// Array of Hyperboles //
// The [title] string will be replaced with the users event titles //
var hyperboles = ["I will absolutely die if I miss [title].", "Possibly the greatest [title] ever.", "OMG OMG OMG! [title]", "I wouldn't miss this [title] for the world.", "Insurmountably important [title]!", "The biggest [title] of all time.", "Don't miss [title] or you will regret it forever, possibly longer.", "Wow! I can't possibly imagine how amazing [title] will be!", "A pox on thee if thou miss thine [title].", "Incredibly astounding [title]!", "One thousand horses couldn't drag me from [title]!", "[title] will be cooler than a January in Montréal!", "[title] will be bigger than the biggest big thing!", "[title] will be hotter than July in Montréal!", "[title] will be staggeringly phenomenal.", "An extraordinarily extraordinary [title]!", "A wondrous spectacle of an unbelievable [title]!", "An elephant never forgets [title], so you shouldn't either."];

$(document).ready(function(){
  
  // extend Storage for JSON objects //
  Storage.prototype.setObject = function(key, value) {
	this.setItem(key, JSON.stringify(value));
  };

  Storage.prototype.getObject = function(key) {
	var value = this.getItem(key);
	return value && JSON.parse(value);
  };
  
  // namespace the app //
  var app = {};

  app.Appt = Backbone.Model.extend({
    //Basic Model of the Appointment
    idAttribute: "appt_id", 
    title: null, 
    startDate: null,
    endDate: null
  });
  
  app.Appts = Backbone.Collection.extend({
    initialize: function (models, options) {
      this.bind("add", options.view.addAppt);
    }
  });
  
  app.AppView = Backbone.View.extend({
    el: $("body"),
    initialize: function () {
      // Initialize the View //
      this.appts = new app.Appts( null, { view: this });
      // Check if the User has already used the app //
      var storedEvents = localStorage.getObject(localStore);
      if ((storedEvents) && (storedEvents.length > 0)) {
      	 storedEvents = sortEvents(storedEvents);
     	 for (var i = 0; i < storedEvents.length; i++) {	
     	 	this.appts.add(storedEvents[i]);
     	 } 
      } else {
      	$("#taskList").append("<li class='list-group-item empty'><h4>You have nothing incredibly spectacular scheduled.</h4></li>");
      }
    },
    events: {
      "click #addBtn":  "showModal",
      "click li":  "showModal",
      "click #saveBtn":  "createAppt",
      "click .removeAppt":  "removeAppt"
    },
    showModal: function (e) {
      // Display the modal to Add a new event //
      var model_id = $(e.currentTarget).find('.removeAppt').data('appt');
      $("#addEvent")[0].reset();
      //console.log(model_id);
	  $('#datetimeStart').datetimepicker();
	  $('#datetimeStop').datetimepicker();
	  $("#datetimeStart").on("dp.change",function (e) {
		$('#datetimeStop').data("DateTimePicker").setMinDate(e.date);
			apptStart = e.date || moment();
			$('#datetimeStop').data("DateTimePicker").setDate(moment(apptStart).add(30, 'minutes'));
	  });
	  $("#datetimeStop").on("dp.change",function (e) {
		$('#datetimeStart').data("DateTimePicker").setMaxDate(e.date);
			apptEnd = e.date;
	  });
	  
      if (model_id) {
      	 $('.modal-title').html('Edit your event:');
     	 var model = this.appts.findWhere({appt_id: model_id});
     	 $('#eventID').val(model.get('appt_id'));
     	 if (model.get('title')) {
     	 	$('#eventTitle').val(model.get('title'));
     	 }
     	 if (model.get('startDate')) {
     	 	 var start = moment(model.get('startDate')).format("MM/DD/YYYY, h:mm:ss a");
  			 $('#datetimeStart').data("DateTimePicker").setDate(start);
     	 }
      	 if (model.get('endDate')) {
			 var end = moment(model.get('endDate')).format("MM/DD/YYYY, h:mm:ss a");
			 $('#datetimeStop').data("DateTimePicker").setDate(end);
     	 }
      } else {
     	 $('.modal-title').html('Add your event:');
      }
      $('#addForm').modal('show');
    },
    createAppt: function () {
      // Create the new Event //
      var model_id = $('#eventID').val();
      if (model_id) {
      	var model = this.appts.findWhere({appt_id: model_id});
		model.set('title', $('#eventTitle').val());
		model.set('startDate', $('#datetimeStart').data("DateTimePicker").getDate());
		model.set('endDate', $('#datetimeStop').data("DateTimePicker").getDate())
		//model.save();
		var storedEvents = localStorage.getObject(localStore);
    	storedEvents = storedEvents.filter(function( obj ) {
		  return obj.appt_id != model_id;
		});
		storedEvents.push(model);
		localStorage.setObject(localStore, storedEvents);
		appview.reSortAppts();
		$('#addForm').modal('hide');
      } else if ($('#eventTitle').val()) {
		  var apptTitle = $('#eventTitle').val();
		  var apptID = makeid(12);
		  var apptModel = new app.Appt({ title: apptTitle, startDate: apptStart, endDate: apptEnd, appt_id: apptID });
		  var storedEvents = [];
		  if (!localStorage.getObject(localStore)) {
			storedEvents.push(apptModel);
			localStorage.setObject(localStore, storedEvents);
		  } else {
			 storedEvents = localStorage.getObject(localStore);
			 storedEvents.push(apptModel);
			 localStorage.setObject(localStore, storedEvents);
		  }
		  this.appts.add(apptModel);
		  $('li.list-group-item:last-child').addClass("animated fadeInDown");
		  //console.log(storedEvents);
		  $('li.list-group-item:last-child').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function () {
			appview.reSortAppts();
		  });
		  $('#addForm').modal('hide');
      } else {
      	$('#eventTitle').parent().addClass('has-error');
      	$('#eventTitle').attr("placeholder", "Please enter a title").focus();
      }
    },
    removeAppt: function (e) {
   		e.stopPropagation();
    	var model_id = $(e.currentTarget).data('appt');
    	//console.log(model_id);
    	var listIndx = $(e.currentTarget).parent('li').index();
    	var modelToRemove = this.appts.findWhere({appt_id: model_id});
    	this.appts.remove(modelToRemove);
    	var storedEvents = localStorage.getObject(localStore);
    	storedEvents = storedEvents.filter(function( obj ) {
		  return obj.appt_id != model_id;
		});
		localStorage.setObject(localStore, storedEvents);
		$('li.list-group-item').eq(listIndx).addClass("animated fadeOutLeft");
    	$('li.list-group-item').eq(listIndx).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function () {
			appview.reSortAppts();
		});
    },
    reSortAppts: function () {
      // Reorder all the the tasks so the oldest appear at the top //
      $("#taskList").html('');
      //console.log(storedEvents);
	  var storedEvents = localStorage.getObject(localStore);
	  
	  //console.log(storedEvents);
      if ((storedEvents) && (storedEvents.length > 0)) {
      	 storedEvents = sortEvents(storedEvents);
     	 for (var i = 0; i < storedEvents.length; i++) {	
     	 	this.appts.add(storedEvents[i]);
      	 }
      } else {
      	$("#taskList").append("<li class='list-group-item empty animated fadeInDown'><h4>You have nothing incredibly spectacular scheduled.</h4></li>");
      }
    },
    addAppt: function (model) {
      // Add all events to the list and group them by past/today/future // 
      // If the event is less than 15 minutes old put it in today //
      var now = moment().subtract(15, 'minutes');
      var start, end;
      if (model.get('startDate')) {
      	start = moment(model.get('startDate')).format("dddd, MMMM Do YYYY, h:mm:ss a");
      } else {
      	start = moment().format("dddd, MMMM Do YYYY, h:mm:ss a");
      }
      if (!model.get('endDate')) {
      	end = moment(model.get('startDate')).add(30, 'minutes').format("dddd, MMMM Do YYYY, h:mm:ss a");
      }
      var title = hyperbolize(model.get('title'));
      //Check if the created date is less than 15 minutes old or today or in the future 
      if (end) {
      	start = start + " until: "+ end; 
      }
      if (moment(model.get('startDate')).isBefore(now)) {
      	$("#taskList").append("<li class='list-group-item past'><span class='glyphicon glyphicon-remove removeAppt pull-right' data-appt="+ model.get('appt_id') +"></span><span class='badge pull-right'>past event</span><h3>" + title + "</h3><p>" + start + "</p></li>");
      } else if (moment(now).isSame(model.get('startDate'), 'day')) {
       	$("#taskList").append("<li class='list-group-item today'><span class='glyphicon glyphicon-remove removeAppt pull-right' data-appt="+ model.get('appt_id') +"></span><span class='badge pull-right'>today</span><h3>" + title + "</h3><p>" + start + "</p></li>");
      } else {
      	$("#taskList").append("<li class='list-group-item future'><span class='glyphicon glyphicon-remove removeAppt pull-right' data-appt="+ model.get('appt_id') +"></span><span class='badge pull-right'>future event</span><h3>" + title + "</h3><p>" + start + "</p></li>");
      }
    }
  });
  
  var appview = new app.AppView();

});


// Generate random ID based on the length of string you want //

function makeid(length) {
    var id = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for( var i=0; i < length; i++ )
        id += possible.charAt(Math.floor(Math.random() * possible.length));
    return id;
}


// Adds the hyperbole to the titles of the events //
function hyperbolize(title) {
	var hyperbole = hyperboles[Math.floor(Math.random()*hyperboles.length)];
	title = hyperbole.replace("[title]", title);
	return title;
}

// Sorts the events by startDate //
function sortEvents(events) {
	events.sort(function(a,b){
		// Turn your strings into dates, and then subtract them
		// to get a value that is either negative, positive, or zero.
  		return new Date(b.startDate) - new Date(a.startDate);
	});
	return events;
}