import Foundation
import Vision
import Cocoa
import ImageIO

struct OCRBlock: Codable {
    let text: String
    let confidence: Double
}

struct OCRResult: Codable {
    let text: String
    let blocks: [OCRBlock]
    let confidence: Double
    let language: String?
    let codeLanguage: String?
}

func printErrorAndExit(_ message: String) -> Never {
    let errorDict = ["error": message]
    if let jsonData = try? JSONEncoder().encode(errorDict),
       let jsonString = String(data: jsonData, encoding: .utf8) {
        print(jsonString)
    } else {
        print("{\"error\":\"\(message)\"}")
    }
    exit(1)
}

func main() {
    let arguments = CommandLine.arguments
    guard arguments.count > 1 else {
        printErrorAndExit("Missing image path argument")
    }
    
    let imagePath = arguments[1]
    guard let image = NSImage(contentsOfFile: imagePath) else {
        printErrorAndExit("Failed to load image from path: \(imagePath)")
    }
    
    guard let tiffData = image.tiffRepresentation,
          let imageSource = CGImageSourceCreateWithData(tiffData as CFData, nil),
          let cgImage = CGImageSourceCreateImageAtIndex(imageSource, 0, nil) else {
        printErrorAndExit("Failed to create CGImage from loaded image")
    }
    
    let requestHandler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    
    var recognizedText = ""
    var blocks: [OCRBlock] = []
    var totalConfidence: Double = 0.0
    var count = 0
    
    let request = VNRecognizeTextRequest { (request, error) in
        if let error = error {
            printErrorAndExit("Vision text recognition error: \(error.localizedDescription)")
        }
        
        guard let observations = request.results as? [VNRecognizedTextObservation] else {
            return
        }
        
        for observation in observations {
            guard let candidate = observation.topCandidates(1).first else {
                continue
            }
            
            let text = candidate.string
            let confidence = Double(candidate.confidence)
            
            blocks.append(OCRBlock(text: text, confidence: confidence))
            recognizedText += text + "\n"
            totalConfidence += confidence
            count += 1
        }
    }
    
    request.recognitionLevel = .accurate
    
    do {
        try requestHandler.perform([request])
    } catch {
        printErrorAndExit("Failed to perform OCR request: \(error.localizedDescription)")
    }
    
    let averageConfidence = count > 0 ? (totalConfidence / Double(count)) : 0.0
    
    let result = OCRResult(
        text: recognizedText.trimmingCharacters(in: .whitespacesAndNewlines),
        blocks: blocks,
        confidence: averageConfidence,
        language: nil,
        codeLanguage: nil
    )
    
    let encoder = JSONEncoder()
    encoder.keyEncodingStrategy = .useDefaultKeys
    
    do {
        let jsonData = try encoder.encode(result)
        if let jsonString = String(data: jsonData, encoding: .utf8) {
            print(jsonString)
        } else {
            printErrorAndExit("Failed to convert OCR result JSON data to string")
        }
    } catch {
        printErrorAndExit("Failed to encode OCR result: \(error.localizedDescription)")
    }
}

main()
