import { cn } from "@/app/components/lib/utils"

interface CourseStepperProps {
  currentStep: number
  totalSteps: number
  sections: { id: number }[]
  courseId: number
  onStepClick?: (index: number) => void
  completedSectionIds: number[]
}

export function CourseStepper({ currentStep, totalSteps, courseId, sections, onStepClick, completedSectionIds }: CourseStepperProps) {

  const completed = new Set<number>(completedSectionIds)

  return (
    <div className="flex items-center justify-center mb-12">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const isCurrent = index + 1 === currentStep
        const sectionId = sections[index]?.id
        const isCompleted = sectionId && completed.has(sectionId)

        return (
          <div key={index} className="flex items-center">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-base font-semibold transition-all duration-300 border-2",
                isCurrent
                  ? "bg-blue-600 text-white shadow-lg border-blue-700 scale-110"
                  : isCompleted
                  ? "bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200 border-blue-400"
                  : "bg-gray-100 text-gray-600 border-gray-300"
              )}
              onClick={() => {
                if (isCompleted && onStepClick) {
                  onStepClick(index)
                }
              }}
            >
              {index + 1}
            </div>
            {index < totalSteps - 1 && (
              <div
                className={cn(
                  "h-1 flex-1 mx-2 transition-colors duration-300",
                  index + 1 < currentStep ? "bg-blue-400" : "bg-gray-300",
                )}
                style={{ minWidth: "40px" }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
