# hookSettings-for-PocketBase
A PocketBase Hook and JS Module to bring [config modules](https://pocketbase.io/docs/js-overview/#handlers-scope) for other JS Hooks to the WebUI

![Collection Image](/images/collection.png)

## Usage

When first run this module creates a new collection `pbHookSettings` within your PocketBase UI.

This collection has two fields `setting` and `value`. 
The `setting` field is a string and the `value` field is JSON data.

It's advised to use the module `hookSettings.js` to create a new settings record.

Those methods can be used within the [handler scope](https://pocketbase.io/docs/js-overview/#handlers-scope) to create a new settings record if it does not exist.
```javascript
require('hookSettings.js').Setting('sampleSetting', defaultValue)
``` 
This will create a new setting in the interface and return a new `Setting` object.

A `Setting` object has the following methods:
- `get()` - Returns the value of the setting
- `set(value)` - Sets the value of the setting

### Tiny example


```javascript
const defaultValue = {
  name: 'John Doe', age: 25,
};
// Entry into pbHookSettings collection will automatically be created
const settings = require('hookSettings.js').Setting('settingName', defaultValue);

settings.get().name;
settings.get().age;

settings.set({name: 'Jane Doe', age: 26});
```


# Install

### Standard hooks folder location

1. Download this repository
2. Unzip the downloaded file
3. Copy the `pb_hooks` folder to your PocketBase executable folder
4. Run PocketBase

### Changed hooks folder location

1. Download this repository
2. Unzip the downloaded file
3. Copy the contents of the `pb_hooks` folder to the location you have set in your PocketBase settings
4. Run PocketBase

# Caveats
- It's currently not possible to use settings `onBeforeBootstrap`
- It's currently not possible to use settings in `cronAdd(NOT POSSIBLE HERE, NOT POSSIBLE HERE, () => {POSSIBLE HERE})` since this is executed before the db is running


# Example

This is an example of how to use the `hookSettings.js` module to create a hook that deletes unverified users
after a set time. The time and mail settings are stored in the `pbHookSettings` collection and can be changed
at any time without having to change the code/restarting from the User Interface.

### Exception
It is possible that `deleteUnverified.pb.js` is executed before `hookSettings.pb.js` which will cause an error, since the `pbHookSettings` collection does not exist yet. This can be fixed by renaming `hookSettings.pb.js` to `0_hookSettings.pb.js` and restarting PocketBase.


### Structure
```text
example_folder
├── pb_data
├── pb_migrations
├── pb_hooks
│   ├── hookSettings.js
│   ├── hookSettings.pb.js
│   └── deleteUnverified.pb.js
├── CHANGELOG.md
├── LICENSE.md
└── pocketbase.exe
```

### deleteUnverified.pb.js
```javascript
onAfterBootstrap((e) => {
    const config = require(`${__hooks}/hookSettings.js`).Setting("deleteUnverified", {
        time: 10, // Time in minutes
        mail: true,
        mailSubject: "Your account has been deleted",
        mailBody: "Your account has been deleted due not being verified within the set time limit."
    })

    $app.logger().debug("Initialized deleteUnverified.pb.js with time: " + config.get().time + " minutes", "type", "hook",
        "file", "deleteUnverified.pb.js")
})

cronAdd("deleteUnverified", "*/" + 2 + " * * * *", () => {
    // Default value is empty since the db entry is already created before this code is executed
    const config = require(`${__hooks}/hookSettings.js`).Setting("deleteUnverified", {})

    const result = arrayOf(new DynamicModel({
        "id":    "",
        "email": "",
    }))

    $app.dao().db()
        .select("id", "email")
        .from("users")
        .andWhere($dbx.hashExp({verified: false}))
        .all(result)


    result.forEach((row) => {
        const e = $app.dao().findRecordById("users", row?.id);
        const s = $app.dao().findRecordById("users", row?.id).getCreated();
        if (s && (new Date().getTime() - s.time().unixMilli()) > config.get().time * 60 * 1000) {
            $app.logger().info("CLEAN Deleting aged unverified user " + row?.id + " with mail " + row?.email, "type", "hook",
                "file", "deleteUnverified.pb.js")
            $app.dao().deleteRecord(e)

            if (!config.get().mail) {
                return
            }

            function replaceTemplates(value) {
                value = value
                    .replace(/{id}/g, e.id)
                    .replace(/{email}/g, e.email())
                    .replace(/{username}/g, e.username())
                    .replace(/{verified}/g, e.verified())
                return value
            }

            const message = new MailerMessage({
                from: {
                    address: $app.settings().meta.senderAddress,
                    name:    $app.settings().meta.senderName,
                },
                to:      [{address: e.email()}],
                subject: replaceTemplates(config.get().mailSubject),
                html: replaceTemplates(config.get().mailBody),
            })

            $app.newMailClient().send(message)
        }
    })
})
```

![Example Image](/images/WithEntry.png)