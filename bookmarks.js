// Insert your Dropbox app key here:
var DROPBOX_APP_KEY = 'okxx3x5p1xhktds';

// Exposed for easy access in the browser console.
var client = new Dropbox.Client({key: DROPBOX_APP_KEY});
var bookmarksTable;

$(function () {

	// Insert a new task record into the table.
	function insertBookmark(bookmark) {
		bookmarksTable.insert({
			title: bookmark.title,
			url: bookmark.url,
			text: bookmark.text,
			created: new Date(),
			updated: new Date()
		});
	}

	function updateList() {
		var records = bookmarksTable.query();

    $(records).each(function(index, record){
      var bookmark = {
        index: index,
        title: record.get('title'),
        url: record.get('url'),
        text: record.get('text'),
        created: record.get('created').toISOString().replace(/(\d+)-(\d+)-(\d+)T(\d+:\d+):\d+.*/, "$3/$2/$1 $4")
      };
      var template = '<tr id="{{index}}"><td>{{title}}</td><td><a href="{{url}}">{{url}}</a></td><td>{{text}}</td><td>{{created}}</td></tr>';
      $('#bookmarks').append(Mustache.to_html(template, bookmark));
    });
	}

	// The login button will start the authentication process.
	$('#loginButton').click(function (e) {
		e.preventDefault();
		// This will redirect the browser to OAuth login.
		client.authenticate();
	});

	// Try to finish OAuth authorization.
	client.authenticate({interactive:false}, function (error) {
		if (error) {
			alert('Authentication error: ' + error);
		}
	});

	if (client.isAuthenticated()) {
		// Client is authenticated. Display UI.
		$('#loginButton').hide();
		$('#main').show();

		client.getDatastoreManager().openDefaultDatastore(function (error, datastore) {
			if (error) {
				alert('Error opening default datastore: ' + error);
			}

			bookmarksTable = datastore.getTable('bookmarks');

			// Populate the initial task list.
			updateList();

			// Ensure that future changes update the list.
			datastore.recordsChanged.addListener(updateList);
		});
	}

	// Delete the record with a given ID.
	function deleteRecord(id) {
		bookmarksTable.get(id).deleteRecord();
	}

	// Register event listeners to handle completing and deleting.
	function addListeners() {
		$('button.delete').click(function (e) {
			e.preventDefault();
			var id = $(this).parents('li').attr('id');
			deleteRecord(id);
		});
	}

	// Hook form submit and add the new task.
	$('#addForm').submit(function (e) {
    var bookmark = {
			title: e.target.title.value,
			url: e.target.url.value,
			text: e.target.text.value
    };
    insertBookmark(bookmark);
		e.preventDefault();
		return false;
	});

});
