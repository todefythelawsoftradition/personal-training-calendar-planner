# Pocket Training

A responsive climbing training and performance tracking prototype inspired by the supplied Sandstone Day reference. It runs without a build step: open `index.html` in a browser or serve this directory with any static file server.

The prototype includes Dashboard, Planner, Workouts, Metrics, Goals, Tests, and Data. Profile information, planned and completed sessions, check-ins, measurements, workouts, goals, and test results are automatically saved in browser `localStorage` under `pocket-training-v1`.

The 12-week planner marks today using the device's local date and refreshes when the app returns to focus or local midnight passes. Dates are shown relative to the sample cycle, which runs from August 17 through November 8, 2026.

Open **Data** to download a full JSON backup, export session/check-in/test-result logs as CSV files, or restore a JSON backup. Import replaces the current browser data after confirmation. Keep backups somewhere safe: browser storage does not sync between devices and can be removed when site data is cleared. The sample cycle can be restored by clearing the `pocket-training-v1` key in browser developer tools.

This local-only approach is useful while prototyping. For accounts or cross-device sync, move the same records to a database behind an authenticated API, associate each record with its owner, and add timestamps and migration/version handling. Collect only the personal or health-related details the product needs, and make data export and deletion easy.
