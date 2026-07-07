### Example 5: Reset and Recovery
 
Source: https://refactoring.guru/es/design-patterns/memento/php/example

Illustrates resetting configuration to defaults and then restoring it from a previous backup.

```php
Array
(
    [maintenance_mode] => 
    [theme] => light
    [debug] => 
)
```

```php
Array
(
    [maintenance_mode] => 
    [theme] => light
    [seo] => Array
        (
            [title] => Best Products Online
            [description] => Find the best products at great prices!
            [keywords] => products, online, shopping, deals
        )

    [debug] => 
    [max_users] => 1000
    [analytics] => Array
        (
            [google_id] => GA-123456
            [facebook_pixel] => FB-789012
        )

)
```

--------------------------------

### Output of Conceptual Strategy Pattern Example in Swift

Source: https://refactoring.guru/es/design-patterns/strategy/swift/example

Shows the execution result of the conceptual Strategy pattern example, demonstrating normal and reverse sorting.

```text
Client: Strategy is set to normal sorting.

Context: Sorting data using the strategy (not sure how it\'ll do it)

a,b,c,d,e

Client: Strategy is set to reverse sorting.

Context: Sorting data using the strategy (not sure how it\'ll do it)

e,d,c,b,a

```

--------------------------------

### Example 6: History Management

Source: https://refactoring.guru/es/design-patterns/memento/php/example

Shows how to view available configuration backups and clear the history.

```php
[0] 2025-07-28 15:04:16 / (5 items, maintenance: )
```

```php
No backups available.
```

--------------------------------

### Conceptual Example of Facade Pattern in C++

Source: https://refactoring.guru/es/design-patterns/facade/cpp/example

Illustrates the structure of the Facade pattern, showing how subsystems interact through a facade class. This example manages subsystem lifecycle and delegates client requests.

```cpp
/**
 * The Subsystem can accept requests either from the facade or client directly.
 * In any case, to the Subsystem, the Facade is yet another client, and it's not
 * a part of the Subsystem.
 */
class Subsystem1 {
 public:
  std::string Operation1() const {
    return "Subsystem1: Ready!\n";
  }
  // ...
  std::string OperationN() const {
    return "Subsystem1: Go!\n";
  }
};
/**
 * Some facades can work with multiple subsystems at the same time.
 */
class Subsystem2 {
 public:
  std::string Operation1() const {
    return "Subsystem2: Get ready!\n";
  }
  // ...
  std::string OperationZ() const {
    return "Subsystem2: Fire!\n";
  }
};

/**
 * The Facade class provides a simple interface to the complex logic of one or
 * several subsystems. The Facade delegates the client requests to the
 * appropriate objects within the subsystem. The Facade is also responsible for
 * managing their lifecycle. All of this shields the client from the undesired
 * complexity of the subsystem.
 */
class Facade {
 protected:
  Subsystem1 *subsystem1_;
  Subsystem2 *subsystem2_;
  /**
   * Depending on your application's needs, you can provide the Facade with
   * existing subsystem objects or force the Facade to create them on its own.
   */
 public:
  /**
   * In this case we will delegate the memory ownership to Facade Class
   */
  Facade(
      Subsystem1 *subsystem1 = nullptr,
      Subsystem2 *subsystem2 = nullptr) {
    this->subsystem1_ = subsystem1 ?: new Subsystem1;
    this->subsystem2_ = subsystem2 ?: new Subsystem2;
  }
  ~Facade() {
    delete subsystem1_;
    delete subsystem2_;
  }
  /**
   * The Facade's methods are convenient shortcuts to the sophisticated
   * functionality of the subsystems. However, clients get only to a fraction of
   * a subsystem's capabilities.
   */
  std::string Operation() {
    std::string result = "Facade initializes subsystems:\n";
    result += this->subsystem1_->Operation1();
    result += this->subsystem2_->Operation1();
    result += "Facade orders subsystems to perform the action:\n";
    result += this->subsystem1_->OperationN();
    result += this->subsystem2_->OperationZ();
    return result;
  }
};

/**
 * The client code works with complex subsystems through a simple interface
 * provided by the Facade. When a facade manages the lifecycle of the subsystem,
 * the client might not even know about the existence of the subsystem. This
 * approach lets you keep the complexity under control.
 */
void ClientCode(Facade *facade) {
  // ...
  std::cout << facade->Operation();
  // ...
}
/**
 * The client code may have some of the subsystem's objects already created. In
 * this case, it might be worthwhile to initialize the Facade with these objects
 * instead of letting the Facade create new instances.
 */

int main() {
  Subsystem1 *subsystem1 = new Subsystem1;
  Subsystem2 *subsystem2 = new Subsystem2;
  Facade *facade = new Facade(subsystem1, subsystem2);
  ClientCode(facade);

  delete facade;

  return 0;
}

```

--------------------------------

### Execution output of the Mediator pattern example

Source: https://refactoring.guru/es/design-patterns/mediator/go/example

Shows the sequence of events and messages printed to the console during the execution of the Go Mediator pattern example.

```text
PassengerTrain: Arrived
FreightTrain: Arrival blocked, waiting
PassengerTrain: Leaving
FreightTrain: Arrival permitted
FreightTrain: Arrived


```

--------------------------------

### Real-world Example: Social Network Connectors

Source: https://refactoring.guru/es/design-patterns/factory-method/php/example

This example illustrates the Factory Method pattern's application in creating social network connectors. It allows for creating posts and logging in without coupling client code to specific network classes.

```text
In this example, the **Factory Method** pattern provides an interface for creating connectors in social networks, which can be used to log into the network, create posts, and potentially perform other activities; all without coupling the client code to a particular social network class.
```

--------------------------------

### PHP Server and Middleware Setup

Source: https://refactoring.guru/es/design-patterns/chain-of-responsibility/php/example

Sets up a server and registers users. It then constructs a middleware chain including throttling, user existence, and role checking, before setting it on the server.

```php
$server->register("admin@example.com", "admin_pass");
$server->register("user@example.com", "user_pass");

// All middleware are chained. The client can build various configurations of
// chains depending on its needs.
$middleware = new ThrottlingMiddleware(2);
$middleware
    ->linkWith(new UserExistsMiddleware($server))
    ->linkWith(new RoleCheckMiddleware());

// The server gets a chain from the client code.
$server->setMiddleware($middleware);
```

--------------------------------

### Client Code Example

Source: https://refactoring.guru/es/design-patterns/builder/cpp/example

Demonstrates how a client interacts with the Director and Concrete Builder to create a product. Note the use of raw pointers for simplicity.

```cpp
void ClientCode(Director& director)
{
    ConcreteBuilder1* builder = new ConcreteBuilder1();
    director.set_builder(builder);
    std::cout << "Standard basic product:\n"; 
    director.BuildMinimalViableProduct();
    

```

--------------------------------

### Output of State Pattern Example

Source: https://refactoring.guru/es/design-patterns/state/python/example

Shows the execution flow and state transitions when running the conceptual State pattern example in Python.

```Text
Context: Transition to ConcreteStateA
ConcreteStateA handles request1.
ConcreteStateA wants to change the state of the context.
Context: Transition to ConcreteStateB
ConcreteStateB handles request2.
ConcreteStateB wants to change the state of the context.
Context: Transition to ConcreteStateA

```

--------------------------------

### Output of the Adapter Pattern Example

Source: https://refactoring.guru/es/design-patterns/adapter/python/example

This output shows the result of running the conceptual Adapter pattern example in Python. It illustrates how the client code interacts with both the Target and the Adapter, which translates the Adaptee's specific request.

```text
Client: I can work just fine with the Target objects:
Target: The default target's behavior.

Client: The Adaptee class has a weird interface. See, I don't understand it:
Adaptee: .eetpadA eht fo roivaheb laicepS

Client: But I can work with it via the Adapter:
Adapter: (TRANSLATED) Special behavior of the Adaptee.

```

--------------------------------

### Application Class Example

Source: https://refactoring.guru/es/design-patterns/builder

Client code demonstrating how to use the Director and Builder to create different products. It shows instantiating builders, passing them to the director, and retrieving the final products.

```php
class Application {

    public function makeCar(): void
    {
        $director = new Director();

        $builder = new CarBuilder();
        $director->constructSportsCar($builder);
        $car = $builder->getProduct();

        $builder = new CarManualBuilder();
        $director->constructSportsCar($builder);
        $manual = $builder->getProduct();

        // The final product is often retrieved from a builder object, as the director
        // doesn't know about and doesn't depend on concrete builders and products.
    }
}
```

--------------------------------

### Output of Facade Pattern Example

Source: https://refactoring.guru/es/design-patterns/facade/cpp/example

The expected output when running the conceptual Facade pattern example in C++. It demonstrates the simplified interaction provided by the facade.

```text
Facade initializes subsystems:
Subsystem1: Ready!
Subsystem2: Get ready!
Facade orders subsystems to perform the action:
Subsystem1: Go!
Subsystem2: Fire!


```

--------------------------------

### Example 7: Real-World Workflow Simulation

Source: https://refactoring.guru/es/design-patterns/memento/php/example

Simulates a typical admin workflow involving configuration updates, backups, and partial rollbacks.

```php
Array
(
    [maintenance_mode] => 
    [theme] => dark
    [seo] => Array
        (
            [title] => Best Products Online
            [description] => Find the best products at great prices!
            [keywords] => products, online, shopping, deals
        )

    [debug] => 
    [max_users] => 1000
    [analytics] => Array
        (
            [google_id] => GA-123456
            [facebook_pixel] => FB-789012
        )

    [promotion_banner] => Black Friday Sale - 50% Off!
    [special_offers] => Array
        (
            [discount] => 50
            [code] => BLACKFRIDAY50
        )

)
```

```php
[0] 2025-07-28 15:04:16 / (6 items, maintenance: )
```

--------------------------------

### Output of Naive Singleton Example

Source: https://refactoring.guru/es/design-patterns/singleton/python/example

This output confirms that the naive Singleton implementation successfully created and returned the same instance for both variables.

```text
Singleton works, both variables contain the same instance.

```

--------------------------------

### Conceptual Example of Bridge Pattern in PHP

Source: https://refactoring.guru/es/design-patterns/bridge/php/example

Illustrates the core structure of the Bridge pattern, showing how an abstraction maintains a reference to an implementation and delegates operations. This example requires no special setup.

```php
<?php

namespace RefactoringGuru\Bridge\Conceptual;

/**
 * The Abstraction defines the interface for the "control" part of the two class
 * hierarchies. It maintains a reference to an object of the Implementation
 * hierarchy and delegates all of the real work to this object.
 */
class Abstraction
{
    /**
     * @var Implementation
     */
    protected $implementation;

    public function __construct(Implementation $implementation)
    {
        $this->implementation = $implementation;
    }

    public function operation(): string
    {
        return "Abstraction: Base operation with:\n" .
            $this->implementation->operationImplementation();
    }
}

/**
 * You can extend the Abstraction without changing the Implementation classes.
 */
class ExtendedAbstraction extends Abstraction
{
    public function operation(): string
    {
        return "ExtendedAbstraction: Extended operation with:\n" .
            $this->implementation->operationImplementation();
    }
}

/**
 * The Implementation defines the interface for all implementation classes. It
 * doesn't have to match the Abstraction's interface. In fact, the two
 * interfaces can be entirely different. Typically the Implementation interface
 * provides only primitive operations, while the Abstraction defines higher-
 * level operations based on those primitives.
 */
interface Implementation
{
    public function operationImplementation(): string;
}

/**
 * Each Concrete Implementation corresponds to a specific platform and
 * implements the Implementation interface using that platform's API.
 */
class ConcreteImplementationA implements Implementation
{
    public function operationImplementation(): string
    {
        return "ConcreteImplementationA: Here's the result on the platform A.\n";
    }
}

class ConcreteImplementationB implements Implementation
{
    public function operationImplementation(): string
    {
        return "ConcreteImplementationB: Here's the result on the platform B.\n";
    }
}

/**
 * Except for the initialization phase, where an Abstraction object gets linked
 * with a specific Implementation object, the client code should only depend on
 * the Abstraction class. This way the client code can support any abstraction-
 * implementation combination.
 */
function clientCode(Abstraction $abstraction)
{
    // ...

    echo $abstraction->operation();

    // ...
}

/**
 * The client code should be able to work with any pre-configured abstraction-
 * implementation combination.
 */
$implementation = new ConcreteImplementationA();
$abstraction = new Abstraction($implementation);
clientCode($abstraction);

echo "\n";

$implementation = new ConcreteImplementationB();
$abstraction = new ExtendedAbstraction($implementation);
clientCode($abstraction);

```

--------------------------------

### Example of Decorator Assembly

Source: https://refactoring.guru/es/design-patterns/decorator

Illustrates how to sequentially wrap a FileDataSource with Compression and Encryption decorators to add multiple functionalities.

```pseudocode
// Opción 1. Un ejemplo sencillo del montaje de un decorador.
class Application is
    method dumbUsageExample() is
        source = new FileDataSource("somefile.dat")
        source.writeData(salaryRecords)
        // El archivo objetivo se ha escrito con datos sin
        // formato.

        source = new CompressionDecorator(source)
        source.writeData(salaryRecords)
        // El archivo objetivo se ha escrito con datos
        // comprimidos.

        source = new EncryptionDecorator(source)
        // La variable fuente ahora contiene esto:
        // Cifrado > Compresión > FileDataSource
        source.writeData(salaryRecords)
        // El archivo se ha escrito con datos comprimidos y
        // encriptados.
```

--------------------------------

### Conceptual Mediator Example Output in Swift

Source: https://refactoring.guru/es/design-patterns/mediator/swift/example

Shows the expected output when the conceptual Mediator example is executed, demonstrating how the mediator coordinates component interactions.

```text
Client triggers operation A.
Component 1 does A.
Mediator reacts on A and triggers following operations:
Component 2 does C.

Client triggers operation D.
Component 2 does D.
Mediator reacts on D and triggers following operations:
Component 1 does B.

Component 2 does C.


```

--------------------------------

### Execution Output of Memento Pattern Example

Source: https://refactoring.guru/es/design-patterns/memento/swift/example

This output shows the step-by-step execution of the Memento pattern example in Swift. It details the state changes, saving operations, and restoration process.

```text
Originator: My initial state is: Super-duper-super-puper-super.

Caretaker: Saving Originator's state...

Originator: I'm doing something important.
Originator: and my state has changed to: 1923

Caretaker: Saving Originator's state...

Originator: I'm doing something important.
Originator: and my state has changed to: 74FB

Caretaker: Saving Originator's state...

Originator: I'm doing something important.
Originator: and my state has changed to: 3681


Caretaker: Here's the list of mementos:

Super-duper-super-puper-super. 11:45:44
1923 11:45:44
74FB 11:45:44

Client: Now, let's rollback!


Caretaker: Restoring state to: 74FB 11:45:44
Originator: My state has changed to: 74FB

Client: Once more!


Caretaker: Restoring state to: 1923 11:45:44
Originator: My state has changed to: 1923

```

--------------------------------

### Output of State Pattern Example

Source: https://refactoring.guru/es/design-patterns/state/cpp/example

This output shows the execution flow of the State pattern example in C++, illustrating the transitions between ConcreteStateA and ConcreteStateB.

```text
Context: Transition to 14ConcreteStateA.
ConcreteStateA handles request1.
ConcreteStateA wants to change the state of the context.
Context: Transition to 14ConcreteStateB.
ConcreteStateB handles request2.
ConcreteStateB wants to change the state of the context.
Context: Transition to 14ConcreteStateA.
  

```

--------------------------------

### Output of Memento Example

Source: https://refactoring.guru/es/design-patterns/memento/swift/example

The execution output of the Swift Memento pattern example, showing the saved states and the result after undo operations.

```text
Text: First Change
Date: hour: 12 minute: 21 second: 50 nanosecond: 821737051 isLeapMonth: false
Color: nil
Range: {12, 0}

Text: Second Change
Date: hour: 12 minute: 21 second: 50 nanosecond: 826483011 isLeapMonth: false
Color: nil
Range: {13, 0}

Text: Second Change & Third Change
Date: hour: 12 minute: 21 second: 50 nanosecond: 829187035 isLeapMonth: false
Color: Optional(UIExtendedSRGBColorSpace 1 0 0 1)
Range: {28, 0}


Client: Perform Undo operation 2 times

Text: First Change
Date: hour: 12 minute: 21 second: 50 nanosecond: 821737051 isLeapMonth: false
Color: nil
Range: {12, 0}


```

--------------------------------

### Output of Mediator Pattern Example

Source: https://refactoring.guru/es/design-patterns/mediator/cpp/example

Shows the expected output when the C++ Mediator pattern conceptual example is executed.

```text
Client triggers operation A.
Component 1 does A.
Mediator reacts on A and triggers following operations:
Component 2 does C.

Client triggers operation D.
Component 2 does D.
Mediator reacts on D and triggers following operations:
Component 1 does B.
Component 2 does C.


```

--------------------------------

### Factory Method Output Example

Source: https://refactoring.guru/es/design-patterns/factory-method/cpp/example

This output demonstrates the execution of the Factory Method pattern, showing how different creators produce different products and how the client remains unaware of the specific product types.

```text
App: Launched with the ConcreteCreator1.
Client: I'm not aware of the creator's class, but it still works.
Creator: The same creator's code has just worked with {Result of the ConcreteProduct1}

App: Launched with the ConcreteCreator2.
Client: I'm not aware of the creator's class, but it still works.
Creator: The same creator's code has just worked with {Result of the ConcreteProduct2}

```

--------------------------------

### Output of Strategy Pattern Example

Source: https://refactoring.guru/es/design-patterns/strategy/ruby/example

This output shows the result of executing the conceptual Strategy pattern example in Ruby, demonstrating both normal and reverse sorting.

```Text
Client: Strategy is set to normal sorting.
Context: Sorting data using the strategy (not sure how it'll do it)
a,b,c,d,e

Client: Strategy is set to reverse sorting.
Context: Sorting data using the strategy (not sure how it'll do it)
e,d,c,b,a

```

--------------------------------

### Output of Prototype Pattern Example in Go

Source: https://refactoring.guru/es/design-patterns/prototype/go/example

Shows the expected output when running the client code. It illustrates the original file system hierarchy and its cloned version, with names appended by '_clone'.

```text
Printing hierarchy for Folder2
  Folder2
    Folder1
        File1
    File2
    File3

Printing hierarchy for clone Folder
  Folder2_clone
    Folder1_clone
        File1_clone
    File2_clone
    File3_clone


```

--------------------------------

### Command Pattern Real-World Example in Swift

Source: https://refactoring.guru/es/design-patterns/command/swift/example

Implementation of the Command pattern using Operation and OperationQueue to handle home automation shortcuts.

```swift
import Foundation
import XCTest


class DelayedOperation: Operation, @unchecked Sendable {

    private var delay: TimeInterval

    init(_ delay: TimeInterval = 0) {
        self.delay = delay
    }

    override var isExecuting : Bool {
        get { return _executing }
        set {
            willChangeValue(forKey: "isExecuting")
            _executing = newValue
            didChangeValue(forKey: "isExecuting")
        }
    }
    private var _executing : Bool = false

    override var isFinished : Bool {
        get { return _finished }
        set {
            willChangeValue(forKey: "isFinished")
            _finished = newValue
            didChangeValue(forKey: "isFinished")
        }
    }
    private var _finished : Bool = false

    override func start() {

        guard delay > 0 else {
            _start()
            return
        }

        let deadline = DispatchTime.now() + delay
        DispatchQueue(label: "").asyncAfter(deadline: deadline) {
            self._start()
        }
    }

    private func _start() {

        guard !self.isCancelled else {
            print("\(self): operation is canceled")
            self.isFinished = true
            return
        }

        self.isExecuting = true
        self.main()
        self.isExecuting = false
        self.isFinished = true
    }
}

class WindowOperation: DelayedOperation, @unchecked Sendable {

    override func main() {
        print("\(self): Windows are closed via HomeKit.")
    }

    override var description: String { return "WindowOperation" }
}

class DoorOperation: DelayedOperation, @unchecked Sendable {

    override func main() {
        print("\(self): Doors are closed via HomeKit.")
    }

    override var description: String { return "DoorOperation" }
}

class TaxiOperation: DelayedOperation, @unchecked Sendable {

    override func main() {
        print("\(self): Taxi is ordered via Uber")
    }

    override var description: String { return "TaxiOperation" }
}



class CommandRealWorld: XCTestCase {

    func testCommandRealWorld() {
        prepareTestEnvironment {

            let siri = SiriShortcuts.shared

            print("User: Hey Siri, I am leaving my home")
            siri.perform(.leaveHome)

            print("User: Hey Siri, I am leaving my work in 3 minutes")
            siri.perform(.leaveWork, delay: 3) /// for simplicity, we use seconds

            print("User: Hey Siri, I am still working")
            siri.cancel(.leaveWork)
        }
    }
}

extension CommandRealWorld {

    struct ExecutionTime {
        static let max: TimeInterval = 5
        static let waiting: TimeInterval = 4
    }

    func prepareTestEnvironment(_ execution: () -> ()) {

        /// This method tells Xcode to wait for async operations. Otherwise the
        /// main test is done immediately.

        let expectation = self.expectation(description: "Expectation for async operations")

        let deadline = DispatchTime.now() + ExecutionTime.waiting
        DispatchQueue.main.asyncAfter(deadline: deadline) { expectation.fulfill() }

        execution()

        wait(for: [expectation], timeout: ExecutionTime.max)
    }
}

class SiriShortcuts {

    static let shared = SiriShortcuts()
    private lazy var queue = OperationQueue()

    private init() {}

    enum Action: String {
        case leaveHome
        case leaveWork
    }

    func perform(_ action: Action, delay: TimeInterval = 0) {
        print("Siri: performing \(action)-action\n")
        switch action {
        case .leaveHome:
            add(operation: WindowOperation(delay))
            add(operation: DoorOperation(delay))
        case .leaveWork:
            add(operation: TaxiOperation(delay))
        }
    }

    func cancel(_ action: Action) {
        print("Siri: canceling \(action)-action\n")
        switch action {
        case .leaveHome:
            cancelOperation(with: WindowOperation.self)
            cancelOperation(with: DoorOperation.self)
        case .leaveWork:
            cancelOperation(with: TaxiOperation.self)
        }
    }

    private func cancelOperation(with operationType: Operation.Type) {
        queue.operations.filter { operation in
            return type(of: operation) == operationType
        }.forEach({ $0.cancel() })
    }

    private func add(operation: Operation) {
        queue.addOperation(operation)
    }
}
```

--------------------------------

### Conceptual Example of Strategy Pattern in PHP

Source: https://refactoring.guru/es/design-patterns/strategy/php/example

This example demonstrates the core structure of the Strategy pattern. It includes the Context class, Strategy interface, and concrete strategy implementations. Use this to understand how different algorithms can be swapped at runtime.

```php
<?php

namespace RefactoringGuru\Strategy\Conceptual;

/**
 * The Context defines the interface of interest to clients.
 */
class Context
{
    /**
     * @var Strategy The Context maintains a reference to one of the Strategy
     * objects. The Context does not know the concrete class of a strategy. It
     * should work with all strategies via the Strategy interface.
     */
    private $strategy;

    /**
     * Usually, the Context accepts a strategy through the constructor, but also
     * provides a setter to change it at runtime.
     */
    public function __construct(Strategy $strategy)
    {
        $this->strategy = $strategy;
    }

    /**
     * Usually, the Context allows replacing a Strategy object at runtime.
     */
    public function setStrategy(Strategy $strategy)
    {
        $this->strategy = $strategy;
    }

    /**
     * The Context delegates some work to the Strategy object instead of
     * implementing multiple versions of the algorithm on its own.
     */
    public function doSomeBusinessLogic(): void
    {
        // ...

        echo "Context: Sorting data using the strategy (not sure how it'll do it)\n";
        $result = $this->strategy->doAlgorithm(["a", "b", "c", "d", "e"]);
        echo implode(",", $result) . "\n";

        // ...
    }
}

/**
 * The Strategy interface declares operations common to all supported versions
 * of some algorithm.
 *
 * The Context uses this interface to call the algorithm defined by Concrete
 * Strategies.
 */
interface Strategy
{
    public function doAlgorithm(array $data): array;
}

/**
 * Concrete Strategies implement the algorithm while following the base Strategy
 * interface. The interface makes them interchangeable in the Context.
 */
class ConcreteStrategyA implements Strategy
{
    public function doAlgorithm(array $data): array
    {
        sort($data);

        return $data;
    }
}

class ConcreteStrategyB implements Strategy
{
    public function doAlgorithm(array $data): array
    {
        rsort($data);

        return $data;
    }
}

/**
 * The client code picks a concrete strategy and passes it to the context. The
 * client should be aware of the differences between strategies in order to make
 * the right choice.
 */
$context = new Context(new ConcreteStrategyA());
echo "Client: Strategy is set to normal sorting.\n";
$context->doSomeBusinessLogic();

echo "\n";

echo "Client: Strategy is set to reverse sorting.\n";
$context->setStrategy(new ConcreteStrategyB());
$context->doSomeBusinessLogic();

```

--------------------------------

### Execution Output

Source: https://refactoring.guru/es/design-patterns/adapter/swift/example

The console output resulting from running the Adapter pattern example.

```text
Starting an authorization via Facebook
Facebook WebView has been shown
///
Starting an authorization via Twitter
The Adapter is called! Redirecting to the original method...
Twitter WebView has been shown. Users will be happy :)
```

--------------------------------

### Output of Observer Pattern Example in Ruby

Source: https://refactoring.guru/es/design-patterns/observer/ruby/example

Shows the console output generated by running the conceptual Observer pattern example, demonstrating how observers react to state changes in the subject.

```text
Subject: Attached an observer.
Subject: Attached an observer.

Subject: I'm doing something important.
Subject: My state has just changed to: 1
Subject: Notifying observers...
ConcreteObserverA: Reacted to the event

Subject: I'm doing something important.
Subject: My state has just changed to: 10
Subject: Notifying observers...
ConcreteObserverB: Reacted to the event

Subject: I'm doing something important.
Subject: My state has just changed to: 2
Subject: Notifying observers...
ConcreteObserverB: Reacted to the event

```

--------------------------------

### Execution Output of Strategy Pattern Example

Source: https://refactoring.guru/es/design-patterns/strategy/swift/example

This output shows the console logs generated by the Swift Strategy pattern example. It indicates that the ListController successfully loaded and displayed models from different data sources.

```text
ListController: Displaying models...
User(id: 1, username: "username1")
User(id: 2, username: "username2")

ListController: Displaying models...
User(id: 3, username: "username3")
User(id: 4, username: "username4")

ListController: Displaying models...
User(id: 5, username: "username5")
User(id: 6, username: "username6")


```

--------------------------------

### Output of Template Method Example

Source: https://refactoring.guru/es/design-patterns/template-method/ruby/example

Shows the execution results of the conceptual Template Method pattern example in Ruby, demonstrating the output from both ConcreteClass1 and ConcreteClass2 when their template methods are called.

```Text
Same client code can work with different subclasses:
AbstractClass says: I am doing the bulk of the work
ConcreteClass1 says: Implemented Operation1
AbstractClass says: But I let subclasses override some operations
ConcreteClass1 says: Implemented Operation2
AbstractClass says: But I am doing the bulk of the work anyway

Same client code can work with different subclasses:
AbstractClass says: I am doing the bulk of the work
ConcreteClass2 says: Implemented Operation1
AbstractClass says: But I let subclasses override some operations
ConcreteClass2 says: Overridden Hook1
ConcreteClass2 says: Implemented Operation2
AbstractClass says: But I am doing the bulk of the work anyway


```

--------------------------------

### Output of Prototype Pattern Conceptual Example

Source: https://refactoring.guru/es/design-patterns/prototype/php/example

The expected output when running the conceptual example of the Prototype pattern in PHP, demonstrating successful cloning of primitive fields and components.

```text
Primitive field values have been carried over to a clone. Yay!
Simple component has been cloned. Yay!
Component with back reference has been cloned. Yay!
Component with back reference is linked to the clone. Yay!


```

--------------------------------

### Execution Output of Memento Pattern Example (Text)

Source: https://refactoring.guru/es/design-patterns/memento/go/example

The expected output when running the Go client code demonstrating the Memento pattern.

```text
originator Current State: A
originator Current State: B
originator Current State: C
Restored to State: B
Restored to State: A

```

--------------------------------

### Conceptual Example of Strategy Pattern in Ruby

Source: https://refactoring.guru/es/design-patterns/strategy/ruby/example

This example demonstrates the structure of the Strategy pattern, including the Context, Strategy interface, and Concrete Strategies. It shows how to switch between different sorting algorithms at runtime.

```Ruby
# The Context defines the interface of interest to clients.
class Context
  # The Context maintains a reference to one of the Strategy objects. The
  # Context does not know the concrete class of a strategy. It should work with
  # all strategies via the Strategy interface.
  attr_writer :strategy

  # Usually, the Context accepts a strategy through the constructor, but also
  # provides a setter to change it at runtime.
  def initialize(strategy)
    @strategy = strategy
  end

  # Usually, the Context allows replacing a Strategy object at runtime.
  def strategy=(strategy)
    @strategy = strategy
  end

  # The Context delegates some work to the Strategy object instead of
  # implementing multiple versions of the algorithm on its own.
  def do_some_business_logic
    # ...

    puts 'Context: Sorting data using the strategy (not sure how it\'ll do it)'
    result = @strategy.do_algorithm(%w[a b c d e])
    print result.join(',')

    # ...
  end
end

# The Strategy interface declares operations common to all supported versions of
# some algorithm.
#
# The Context uses this interface to call the algorithm defined by Concrete
# Strategies.
class Strategy
  # @abstract
  #
  # @param [Array] data
  def do_algorithm(_data)
    raise NotImplementedError, "#{self.class} has not implemented method '#{__method__}'"
  end
end

# Concrete Strategies implement the algorithm while following the base Strategy
# interface. The interface makes them interchangeable in the Context.

class ConcreteStrategyA < Strategy
  # @param [Array] data
  #
  # @return [Array]
  def do_algorithm(data)
    data.sort
  end
end

class ConcreteStrategyB < Strategy
  # @param [Array] data
  #
  # @return [Array]
  def do_algorithm(data)
    data.sort.reverse
  end
end

# The client code picks a concrete strategy and passes it to the context. The
# client should be aware of the differences between strategies in order to make
# the right choice.

context = Context.new(ConcreteStrategyA.new)
puts 'Client: Strategy is set to normal sorting.'
context.do_some_business_logic
puts "\n\n"

puts 'Client: Strategy is set to reverse sorting.'
context.strategy = ConcreteStrategyB.new
context.do_some_business_logic

```

--------------------------------

### Singleton Execution Output

Source: https://refactoring.guru/es/design-patterns/singleton/php/example

The expected console output after running the Singleton implementation example.

```text
2018-06-04: Started!
2018-06-04: Logger has a single instance.
2018-06-04: Config singleton also works fine.
2018-06-04: Finished!
```

--------------------------------

### Output of the Bridge Pattern Example

Source: https://refactoring.guru/es/design-patterns/bridge/cpp/example

The expected output when running the conceptual C++ example of the Bridge pattern, demonstrating the results from different concrete implementations.

```text
Abstraction: Base operation with:
ConcreteImplementationA: Here's the result on the platform A.

ExtendedAbstraction: Extended operation with:
ConcreteImplementationB: Here's the result on the platform B.


```

--------------------------------

### Iterator Pattern C++ Example Output

Source: https://refactoring.guru/es/design-patterns/iterator/cpp/example

This output shows the result of running the C++ Iterator pattern example, demonstrating traversal of integer and custom data collections.

```text
________________Iterator with int______________________________________
0
1
2
3
4
5
6
7
8
9
________________Iterator with custom Class______________________________
100
1000
10000


```

--------------------------------

### Conceptual Example of Prototype Pattern in C++

Source: https://refactoring.guru/es/design-patterns/prototype/cpp/example

Illustrates the structure of the Prototype design pattern, focusing on its components and their relationships. This example demonstrates how to clone objects using a common interface.

```cpp
using std::string;

// Prototype Design Pattern
//
// Intent: Lets you copy existing objects without making your code dependent on
// their classes.

enum Type {
  PROTOTYPE_1 = 0,
  PROTOTYPE_2
};

/**
 * The example class that has cloning ability. We'll see how the values of field
 * with different types will be cloned.
 */

class Prototype {
 protected:
  string prototype_name_;
  float prototype_field_;

 public:
  Prototype() {}
  Prototype(string prototype_name)
      : prototype_name_(prototype_name) {
  }
  virtual ~Prototype() {}
  virtual Prototype *Clone() const = 0;
  virtual void Method(float prototype_field) {
    this->prototype_field_ = prototype_field;
    std::cout << "Call Method from " << prototype_name_ << " with field : " << prototype_field << std::endl;
  }
};

/**
 * ConcretePrototype1 is a Sub-Class of Prototype and implement the Clone Method
 * In this example all data members of Prototype Class are in the Stack. If you
 * have pointers in your properties for ex: String* name_ ,you will need to
 * implement the Copy-Constructor to make sure you have a deep copy from the
 * clone method
 */

class ConcretePrototype1 : public Prototype {
 private:
  float concrete_prototype_field1_;

 public:
  ConcretePrototype1(string prototype_name, float concrete_prototype_field)
      : Prototype(prototype_name), concrete_prototype_field1_(concrete_prototype_field) {
  }

  /**
   * Notice that Clone method return a Pointer to a new ConcretePrototype1
   * replica. so, the client (who call the clone method) has the responsability
   * to free that memory. If you have smart pointer knowledge you may prefer to
   * use unique_pointer here.
   */
  Prototype *Clone() const override {
    return new ConcretePrototype1(*this);
  }
};

class ConcretePrototype2 : public Prototype {
 private:
  float concrete_prototype_field2_;

 public:
  ConcretePrototype2(string prototype_name, float concrete_prototype_field)
      : Prototype(prototype_name), concrete_prototype_field2_(concrete_prototype_field) {
  }
  Prototype *Clone() const override {
    return new ConcretePrototype2(*this);
  }
};

/**
 * In PrototypeFactory you have two concrete prototypes, one for each concrete
 * prototype class, so each time you want to create a bullet , you can use the
 * existing ones and clone those.
 */

class PrototypeFactory {
 private:
  std::unordered_map<Type, Prototype *, std::hash<int>> prototypes_;

 public:
  PrototypeFactory() {
    prototypes_[Type::PROTOTYPE_1] = new ConcretePrototype1("PROTOTYPE_1 ", 50.f);
    prototypes_[Type::PROTOTYPE_2] = new ConcretePrototype2("PROTOTYPE_2 ", 60.f);
  }

  /**
   * Be carefull of free all memory allocated. Again, if you have smart pointers
   * knowelege will be better to use it here.
   */

  ~PrototypeFactory() {
    delete prototypes_[Type::PROTOTYPE_1];
    delete prototypes_[Type::PROTOTYPE_2];
  }

  /**
   * Notice here that you just need to specify the type of the prototype you
   * want and the method will create from the object with this type.
   */
  Prototype *CreatePrototype(Type type) {
    return prototypes_[type]->Clone();
  }
};

void Client(PrototypeFactory &prototype_factory) {
  std::cout << "Let's create a Prototype 1\n";

  Prototype *prototype = prototype_factory.CreatePrototype(Type::PROTOTYPE_1);
  prototype->Method(90);
  delete prototype;

  std::cout << "\n";

  std::cout << "Let's create a Prototype 2 \n";

  prototype = prototype_factory.CreatePrototype(Type::PROTOTYPE_2);
  prototype->Method(10);

  delete prototype;
}

int main() {
  PrototypeFactory *prototype_factory = new PrototypeFactory();
  Client(*prototype_factory);
  delete prototype_factory;

  return 0;
}

```

--------------------------------

### Output of Factory Method Pattern Example

Source: https://refactoring.guru/es/design-patterns/factory-method/python/example

This output shows the result of running the conceptual example of the Factory Method pattern in Python. It demonstrates how different concrete creators produce different concrete products, and how the client code remains unaware of the specific product types.

```Text
App: Launched with the ConcreteCreator1.
Client: I'm not aware of the creator's class, but it still works.
Creator: The same creator's code has just worked with {Result of the ConcreteProduct1}

App: Launched with the ConcreteCreator2.
Client: I'm not aware of the creator's class, but it still works.
Creator: The same creator's code has just worked with {Result of the ConcreteProduct2}


```

--------------------------------

### Conceptual Example of Strategy Pattern in Swift

Source: https://refactoring.guru/es/design-patterns/strategy/swift/example

Illustrates the structure of the Strategy pattern, including Context, Strategy interface, and Concrete Strategies. Use this to understand the pattern's composition and relationships.

```swift
import XCTest

/// The Context defines the interface of interest to clients.
class Context {

    /// The Context maintains a reference to one of the Strategy objects. The
    /// Context does not know the concrete class of a strategy. It should work
    /// with all strategies via the Strategy interface.
    private var strategy: Strategy

    /// Usually, the Context accepts a strategy through the constructor, but
    /// also provides a setter to change it at runtime.
    init(strategy: Strategy) {
        self.strategy = strategy
    }

    /// Usually, the Context allows replacing a Strategy object at runtime.
    func update(strategy: Strategy) {
        self.strategy = strategy
    }

    /// The Context delegates some work to the Strategy object instead of
    /// implementing multiple versions of the algorithm on its own.
    func doSomeBusinessLogic() {
        print("Context: Sorting data using the strategy (not sure how it\'ll do it)\n")

        let result = strategy.doAlgorithm(["a", "b", "c", "d", "e"])
        print(result.joined(separator:","))
    }
}

/// The Strategy interface declares operations common to all supported versions
/// of some algorithm.
///
/// The Context uses this interface to call the algorithm defined by Concrete
/// Strategies.
protocol Strategy {

    func doAlgorithm<T: Comparable>(_ data: [T]) -> [T]
}

/// Concrete Strategies implement the algorithm while following the base
/// Strategy interface. The interface makes them interchangeable in the Context.
class ConcreteStrategyA: Strategy {

    func doAlgorithm<T: Comparable>(_ data: [T]) -> [T] {
        return data.sorted()
    }
}

class ConcreteStrategyB: Strategy {

    func doAlgorithm<T: Comparable>(_ data: [T]) -> [T] {
        return data.sorted(by: >)
    }
}

/// Let\'s see how it all works together.
class StrategyConceptual: XCTestCase {

    func test() {

        /// The client code picks a concrete strategy and passes it to the
        /// context. The client should be aware of the differences between
        /// strategies in order to make the right choice.

        let context = Context(strategy: ConcreteStrategyA())
        print("Client: Strategy is set to normal sorting.\n")
        context.doSomeBusinessLogic()

        print("\nClient: Strategy is set to reverse sorting.\n")
        context.update(strategy: ConcreteStrategyB())
        context.doSomeBusinessLogic()
    }
}

```

--------------------------------

### Strategy Pattern Example Output

Source: https://refactoring.guru/es/design-patterns/strategy/php/example

This output demonstrates a client interacting with a system that uses the Strategy pattern to handle different operations like order creation, listing, and payment processing.

```text
Client: Let's create some orders
Controller: POST request to /orders with {"email":"me@example.com","product":"ABC Cat food (XL)","total":9.95}
Controller: Created the order #0.
Controller: POST request to /orders with {"email":"me@example.com","product":"XYZ Cat litter (XXL)","total":19.95}
Controller: Created the order #1.

Client: List my orders, please
Controller: GET request to /orders
Controller: Here's all orders:
{
    "id": 0,
    "status": "new",
    "email": "me@example.com",
    "product": "ABC Cat food (XL)",
    "total": 9.95
}
{
    "id": 1,
    "status": "new",
    "email": "me@example.com",
    "product": "XYZ Cat litter (XXL)",
    "total": 19.95
}

Client: I'd like to pay for the second, show me the payment form
Controller: GET request to /order/1/payment/paypal
Controller: here's the payment form:
<form action="https://paypal.com/payment" method="POST">
    <input type="hidden" id="email" value="me@example.com">
    <input type="hidden" id="total" value="19.95">
    <input type="hidden" id="returnURL" value="https://our-website.com/order/1/payment/paypal/return">
    <input type="submit" value="Pay on PayPal">
</form>

Client: ...pushes the Pay button...

Client: Oh, I'm redirected to the PayPal.

Client: ...pays on the PayPal...

Client: Alright, I'm back with you, guys.
Controller: GET request to /order/1/payment/paypal/return?key=c55a3964833a4b0fa4469ea94a057152&success=true&total=19.95
PayPalPayment: ...validating... Done!
Controller: Thanks for your order!
Order: #1 is now completed.

```

--------------------------------

### Conceptual Example of Adapter Pattern in C++

Source: https://refactoring.guru/es/design-patterns/adapter/cpp/example

This example demonstrates the structure of the Adapter pattern, showing how a Target interface is made compatible with an Adaptee's incompatible interface through an Adapter class. It requires C++11 or later for std::reverse.

```cpp
/**
 * The Target defines the domain-specific interface used by the client code.
 */
class Target {
 public:
  virtual ~Target() = default;

  virtual std::string Request() const {
    return "Target: The default target's behavior.";
  }
};

/**
 * The Adaptee contains some useful behavior, but its interface is incompatible
 * with the existing client code. The Adaptee needs some adaptation before the
 * client code can use it.
 */
class Adaptee {
 public:
  std::string SpecificRequest() const {
    return ".eetpadA eht fo roivaheb laicepS";
  }
};

/**
 * The Adapter makes the Adaptee's interface compatible with the Target's
 * interface.
 */
class Adapter : public Target {
 private:
  Adaptee *adaptee_;

 public:
  Adapter(Adaptee *adaptee) : adaptee_(adaptee) {}
  std::string Request() const override {
    std::string to_reverse = this->adaptee_->SpecificRequest();
    std::reverse(to_reverse.begin(), to_reverse.end());
    return "Adapter: (TRANSLATED) " + to_reverse;
  }
};

/**
 * The client code supports all classes that follow the Target interface.
 */
void ClientCode(const Target *target) {
  std::cout << target->Request();
}

int main() {
  std::cout << "Client: I can work just fine with the Target objects:\n";
  Target *target = new Target;
  ClientCode(target);
  std::cout << "\n\n";
  Adaptee *adaptee = new Adaptee;
  std::cout << "Client: The Adaptee class has a weird interface. See, I don't understand it:\n";
  std::cout << "Adaptee: " << adaptee->SpecificRequest();
  std::cout << "\n\n";
  std::cout << "Client: But I can work with it via the Adapter:\n";
  Adapter *adapter = new Adapter(adaptee);
  ClientCode(adapter);
  std::cout << "\n";

  delete target;
  delete adaptee;
  delete adapter;

  return 0;
}

```

--------------------------------

### Main Execution Logic

Source: https://refactoring.guru/es/design-patterns/adapter/go/example

Demonstrates the usage of both the native Mac implementation and the Windows adapter.

```go
package main

func main() {

	client := &Client{}
	mac := &Mac{}

	client.InsertLightningConnectorIntoComputer(mac)

	windowsMachine := &Windows{}
	windowsMachineAdapter := &WindowsAdapter{
		windowMachine: windowsMachine,
	}

	client.InsertLightningConnectorIntoComputer(windowsMachineAdapter)
}
```