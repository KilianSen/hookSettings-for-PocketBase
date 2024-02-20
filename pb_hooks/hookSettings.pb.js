onAfterBootstrap((e) => {
    /// Initialize the hook settings collection
    /// I know using a try catch block is not the best way to do this, but it works for now
    $app.logger().debug(
        "Initializing hookSettings.pb.js",
        "type", "hook",
        "file", "hookSettings.pb.js"
    )
    try {
        /// Try to find the collection (fails if it doesn't exist)
        !$app.dao().findCollectionByNameOrId("pbHookSettings")
        $app.logger().debug(
            "Hook settings collection found, skipping initialization",
            "type", "hook",
            "file", "hookSettings.pb.js"
        )
    } catch (ignored) {
        /// create collection
        $app.logger().info(
            "Hook settings collection not found, creating!",
            "type", "hook",
            "file", "hookSettings.pb.js"
        )
        const form = new CollectionUpsertForm($app, new Collection())
        form.name = "pbHookSettings"
        form.type = "base"
        form.schema.addField(new SchemaField({
            name: "setting",
            type: "text",
            required: true,
            presentable: true,
            options: {
                maxSize: 999,
            }
        }))
        form.schema.addField(new SchemaField({
            name: "state",
            type: "json",
            required: true,
            options: {
                maxSize: 999
            }
        }))
        form.submit()
    }
})