module.exports = {
    Setting: (setting, defaultValue) => {
        class HookSetting {
            constructor(setting, defaultValue) {
                this.setting = setting
                this.defaultValue = defaultValue

                try {
                    if (this.recordNotExists()) {
                        this.set(this.defaultValue)
                    }
                } catch (unused) {
                    console.log("------------------")
                    console.log("")
                    console.log("An error occurred in hookSettings.js!")
                    console.log("A possible cause of this is that the pbHookSettings collection does not yet exist.")
                    console.log("This can happen if hookSettings.js is called before hookSettings.pb.js (only needs")
                    console.log("to be called once before hookSettings.js). There are two ways to fix this:")
                    console.log("1. Try to start PocketBase until hookSettings.pb.js is called before hookSettings.js")
                    console.log("2. (recommended) Temporarily rename hookSettings.pb.js to hookSettings.pb.js")
                    console.log("3. (not recommended) Manually create the pbHookSettings collection in the database")
                    console.log("")
                    console.log("------------------")
                }
            }


            possibleRecords() {
                return $app.dao().findRecordsByExpr("pbHookSettings", $dbx.hashExp({setting: this.setting}))
            }

            recordNotExists() {
                return this.possibleRecords().length === 0
            }

            get() {
                let result = this.possibleRecords()
                if (result.length > 0) {
                    return JSON.parse(result[0].get("state"))
                }
                return this.defaultValue
            }

            set(value) {
                if (this.recordNotExists()) {
                    let record = new Record($app.dao().findCollectionByNameOrId("pbHookSettings"), {
                        setting: this.setting,
                        state: defaultValue
                    })
                    $app.dao().saveRecord(record)
                }
                let result = $app.dao().findRecordsByExpr("pbHookSettings", $dbx.hashExp({setting: this.setting}))[0]
                result.set("state", JSON.stringify(value))
                $app.dao().saveRecord(result)
            }
        }

        return new HookSetting(setting, defaultValue)
    }
}