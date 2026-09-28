import SwiftUI
import ReactNativeWatchOS

struct ContentView: View {
    private let bundleURL = ReactNativeWatchOSHost.defaultBundleURL()

    var body: some View {
        ReactNativeWatchOSView(bundleURL: bundleURL)
    }
}
