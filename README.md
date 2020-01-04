# Watson
[Screeps](https://screeps.com/) is a web based game that is played in real time. The caveat is that each player must program the behavior for every action that takes place in the game. I wrote a push-down automated ([PD-A](https://en.wikipedia.org/wiki/Pushdown_automaton)) system for playing the game entirely autonomously. 

This codebase is capable of interacting with other players and the game world all on its own. It doesn't perform spectacularly, but it is robust enough to handle complex and unpredicatble actions of other players.

Pushdown automation works by creating a "stack" for each actor. The actor tries to execute its top-most state. Each state can, however, push a new state to the top of the stack, or pop itself off of the top of the stack. 

To give a real world example, a person's top-state could be to buy groceries. The "buy groceries" state returns that it is not at the grocery store and can't buy groceries, so it pushes a state of "get to the grocery store" to the stack, and the actor now attempts to get to the grocery store.
