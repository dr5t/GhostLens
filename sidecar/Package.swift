// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "ocr-cli",
    platforms: [
        .macOS(.v13)
    ],
    products: [
        .executable(name: "ocr-cli", targets: ["OCRService"])
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "OCRService",
            dependencies: [],
            path: "Sources/OCRService"
        )
    ]
)
