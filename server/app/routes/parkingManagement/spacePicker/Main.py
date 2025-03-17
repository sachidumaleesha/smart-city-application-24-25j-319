import cv2
import pickle
import cvzone
import numpy as np

# Initialize webcam
cap = cv2.VideoCapture(0)  # Use 1 if external camera

# Load or initialize parking slot positions
try:
    with open('CarParkingPos', 'rb') as f:
        posList = pickle.load(f)
except:
    posList = []

drawing = False
start_point = (-1, -1)
temp_rectangle = None

def mouseClick(events, x, y, flags, params):
    """Handles mouse clicks for adding/removing parking spaces."""
    global drawing, start_point, temp_rectangle

    if events == cv2.EVENT_LBUTTONDOWN:
        drawing = True
        start_point = (x, y)
        temp_rectangle = None

    elif events == cv2.EVENT_MOUSEMOVE:
        if drawing:
            temp_rectangle = (start_point, (x, y))

    elif events == cv2.EVENT_LBUTTONUP:
        drawing = False
        end_point = (x, y)
        if start_point != end_point:
            posList.append((start_point[0], start_point[1], end_point[0], end_point[1]))  # Save full rectangle
            with open('CarParkingPos', 'wb') as f:
                pickle.dump(posList, f)

    elif events == cv2.EVENT_RBUTTONDOWN:
        for i, pos in enumerate(posList):
            x1, y1, x2, y2 = pos
            if x1 <= x <= x2 and y1 <= y <= y2:
                posList.pop(i)
                with open('CarParkingPos', 'wb') as f:
                    pickle.dump(posList, f)
                break

def checkParkingSpace(imgPro, img):
    """Detects free/occupied parking spaces dynamically."""
    spaceCounter = 0

    for pos in posList:
        x1, y1, x2, y2 = pos
        width = abs(x2 - x1)  # Calculate dynamic width
        height = abs(y2 - y1)  # Calculate dynamic height

        imgCrop = imgPro[y1:y1 + height, x1:x1 + width]
        count = cv2.countNonZero(imgCrop)

        if count < 2000:  # Threshold for detecting empty spaces
            color = (0, 255, 0)  # Green for free space
            thickness = 5
            spaceCounter += 1
        else:
            color = (0, 0, 255)  # Red for occupied
            thickness = 2

        cv2.rectangle(img, (x1, y1), (x2, y2), color, thickness)
        cvzone.putTextRect(img, str(count), (x1, y1 + height - 3), scale=1, thickness=2, offset=0, colorR=color)

    cvzone.putTextRect(img, f'Free: {spaceCounter}/{len(posList)}', (100, 50), scale=3, thickness=5, offset=20, colorR=(0, 200, 0))

while True:
    success, img = cap.read()
    if not success:
        print("Failed to capture frame. Check your webcam.")
        break

    imgGray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    imgBlur = cv2.GaussianBlur(imgGray, (3, 3), 1)
    imgThreshold = cv2.adaptiveThreshold(imgBlur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 25, 16)
    imgMedian = cv2.medianBlur(imgThreshold, 5)
    kernel = np.ones((3, 3), np.uint8)
    imgDilate = cv2.dilate(imgMedian, kernel, iterations=1)

    checkParkingSpace(imgDilate, img)

    for pos in posList:
        x1, y1, x2, y2 = pos
        cv2.rectangle(img, (x1, y1), (x2, y2), (255, 255, 0), 2)

    if temp_rectangle:
        cv2.rectangle(img, temp_rectangle[0], temp_rectangle[1], (0, 0, 255), 2)

    cv2.imshow("Live Parking Space Picker", img)
    cv2.setMouseCallback("Live Parking Space Picker", mouseClick)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()