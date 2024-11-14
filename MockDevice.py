#include <iostream>
#include <iomanip>

void printStack(size_t frame_size) {
    // Get the address of the frame's base (the current stack pointer)
    void* stack_pointer = __builtin_frame_address(0);

    // Cast the stack pointer to an integer pointer
    unsigned long* stack_contents = reinterpret_cast<unsigned long*>(stack_pointer);

    std::cout << "Stack contents (up to " << frame_size * sizeof(unsigned long) << " bytes):\n";

    // Print the stack contents
    for (size_t i = 0; i < frame_size; ++i) {
        std::cout << std::setw(2) << i << ": "
                  << std::hex << stack_contents[i]
                  << std::dec << std::endl;
    }
}

void sampleFunction() {
    int a = 42;
    double b = 3.14;
    char c = 'A';

    // Print the stack contents
    printStack(15); // Arbitrary size, be cautious not to exceed stack frame limits
}

int main() {
    sampleFunction();
    return 0;
}