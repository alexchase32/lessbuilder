<?php
// Set the content type to JSON
header('Content-Type: application/json');

// Path to the lessons.json file
$filePath = 'data/lessons.json';

// Check if the file exists
if (!file_exists($filePath)) {
    echo json_encode(['lesson' => null]);
    exit;
}

// Read the lessons file
$lessonsJson = file_get_contents($filePath);
$lessons = json_decode($lessonsJson, true);

// Return the first lesson (for now, we're just handling one lesson)
$lesson = !empty($lessons) ? $lessons[0] : null;

echo json_encode(['lesson' => $lesson]);
?>